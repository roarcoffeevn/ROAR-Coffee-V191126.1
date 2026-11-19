import fs from 'node:fs';
import path from 'node:path';
import type Database from 'better-sqlite3';

export const DATA_SNAPSHOT_PATH = path.resolve(process.cwd(), 'data', 'roar-cms-snapshot.json');
export const PUBLIC_SNAPSHOT_PATH = path.resolve(process.cwd(), 'public', 'roar-snapshot.json');

export interface RoarCmsSnapshot {
  version: number;
  exportedAt: string;
  tables: {
    products: any[];
    coffee_origins: any[];
    personalities: any[];
    cms_pages: any[];
    journal_articles: any[];
    promotions: any[];
    membership_tiers: any[];
    loyalty_settings: any[];
    site_settings: Array<{ key: string; value: string }>;
    media_assets: any[];
  };
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function buildCmsSnapshot(db: Database.Database): RoarCmsSnapshot {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: {
      products: db.prepare('SELECT * FROM products ORDER BY id ASC').all(),
      coffee_origins: db.prepare('SELECT * FROM coffee_origins ORDER BY id ASC').all(),
      personalities: db.prepare('SELECT * FROM personalities ORDER BY sort_order ASC, id ASC').all(),
      cms_pages: db.prepare('SELECT * FROM cms_pages ORDER BY group_name ASC, slug ASC').all(),
      journal_articles: db.prepare('SELECT * FROM journal_articles ORDER BY id ASC').all(),
      promotions: db.prepare('SELECT * FROM promotions ORDER BY id ASC').all(),
      membership_tiers: db.prepare('SELECT * FROM membership_tiers ORDER BY min_spend_vnd ASC').all(),
      loyalty_settings: db.prepare('SELECT * FROM loyalty_settings ORDER BY id ASC').all(),
      site_settings: db.prepare('SELECT key, value FROM site_settings ORDER BY key ASC').all() as Array<{
        key: string;
        value: string;
      }>,
      media_assets: db.prepare('SELECT * FROM media_assets ORDER BY id ASC').all(),
    },
  };
}

export function exportCmsSnapshotToDisk(db: Database.Database): RoarCmsSnapshot {
  const snapshot = buildCmsSnapshot(db);
  const serialized = JSON.stringify(snapshot, null, 2);

  for (const target of [DATA_SNAPSHOT_PATH, PUBLIC_SNAPSHOT_PATH]) {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(target, serialized, 'utf-8');
  }

  // Ensure SQLite file itself has no unflushed journal pages
  try {
    db.pragma('wal_checkpoint(TRUNCATE)');
  } catch {
    // Ignore when already in DELETE journal mode
  }

  return snapshot;
}

export function scheduleSnapshotSync(db: Database.Database): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    try {
      exportCmsSnapshotToDisk(db);
    } catch (err) {
      console.error('Failed to sync CMS snapshot:', err);
    }
  }, 150);
}

function readSnapshotFile(): RoarCmsSnapshot | null {
  for (const candidate of [DATA_SNAPSHOT_PATH, PUBLIC_SNAPSHOT_PATH]) {
    if (fs.existsSync(candidate)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(candidate, 'utf-8')) as RoarCmsSnapshot;
        if (parsed && parsed.tables && Array.isArray(parsed.tables.products)) {
          return parsed;
        }
      } catch {
        // try next candidate
      }
    }
  }
  return null;
}

export function restoreFromSnapshot(db: Database.Database, options: { force?: boolean; snapshotData?: RoarCmsSnapshot } = {}): boolean {
  const snap = options.snapshotData || readSnapshotFile();
  if (!snap || !snap.tables) return false;

  const t = snap.tables;
  const force = Boolean(options.force);

  const countOf = (table: string): number => (db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as { c: number }).c;

  const needsRestore =
    force ||
    countOf('products') === 0 ||
    countOf('coffee_origins') === 0 ||
    countOf('personalities') === 0 ||
    countOf('cms_pages') === 0 ||
    countOf('journal_articles') === 0;

  if (!needsRestore) return false;

  const runTx = db.transaction(() => {
    if (Array.isArray(t.products) && t.products.length > 0 && (force || countOf('products') === 0)) {
      const upsertProd = db.prepare(`
        INSERT INTO products (
          slug, sku, barcode, category, sub_category, name_vi, name_en, subtitle_vi, subtitle_en,
          description_vi, description_en, coffee_type, blend_summary_vi, blend_summary_en, blend_public,
          roast_profile_vi, roast_profile_en, tasting_notes_vi, tasting_notes_en,
          brewing_methods_json, variants_json, pricing_tiers_json, packaging_options_json,
          price_vnd, price_usd, inventory, moq, status, is_demo_data,
          mascot_slug, screen_size, processing_method, origin_region,
          harvest_year, moisture_content, density, defect_info, grading_spec,
          image_key, gallery_images_json, featured, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          sku = excluded.sku,
          barcode = excluded.barcode,
          category = excluded.category,
          sub_category = excluded.sub_category,
          name_vi = excluded.name_vi,
          name_en = excluded.name_en,
          subtitle_vi = excluded.subtitle_vi,
          subtitle_en = excluded.subtitle_en,
          description_vi = excluded.description_vi,
          description_en = excluded.description_en,
          coffee_type = excluded.coffee_type,
          blend_summary_vi = excluded.blend_summary_vi,
          blend_summary_en = excluded.blend_summary_en,
          blend_public = excluded.blend_public,
          roast_profile_vi = excluded.roast_profile_vi,
          roast_profile_en = excluded.roast_profile_en,
          tasting_notes_vi = excluded.tasting_notes_vi,
          tasting_notes_en = excluded.tasting_notes_en,
          brewing_methods_json = excluded.brewing_methods_json,
          variants_json = excluded.variants_json,
          pricing_tiers_json = excluded.pricing_tiers_json,
          packaging_options_json = excluded.packaging_options_json,
          price_vnd = excluded.price_vnd,
          price_usd = excluded.price_usd,
          inventory = excluded.inventory,
          moq = excluded.moq,
          status = excluded.status,
          is_demo_data = excluded.is_demo_data,
          mascot_slug = excluded.mascot_slug,
          screen_size = excluded.screen_size,
          processing_method = excluded.processing_method,
          origin_region = excluded.origin_region,
          harvest_year = excluded.harvest_year,
          moisture_content = excluded.moisture_content,
          density = excluded.density,
          defect_info = excluded.defect_info,
          grading_spec = excluded.grading_spec,
          image_key = excluded.image_key,
          gallery_images_json = excluded.gallery_images_json,
          featured = excluded.featured
      `);
      for (const p of t.products) {
        upsertProd.run(
          p.slug, p.sku, p.barcode || '', p.category, p.sub_category || '', p.name_vi, p.name_en, p.subtitle_vi || '', p.subtitle_en || '',
          p.description_vi, p.description_en, p.coffee_type, p.blend_summary_vi || '', p.blend_summary_en || '', p.blend_public ?? 1,
          p.roast_profile_vi || '', p.roast_profile_en || '', p.tasting_notes_vi || '', p.tasting_notes_en || '',
          p.brewing_methods_json || '[]', p.variants_json || '[]', p.pricing_tiers_json || '[]', p.packaging_options_json || '[]',
          p.price_vnd || 0, p.price_usd || 0, p.inventory || 0, p.moq || '1', p.status || 'active', p.is_demo_data ?? 1,
          p.mascot_slug || '', p.screen_size || '', p.processing_method || '', p.origin_region || '',
          p.harvest_year || '', p.moisture_content || '', p.density || '', p.defect_info || '', p.grading_spec || '',
          p.image_key || 'product_robusta_house', p.gallery_images_json || '[]', p.featured ?? 0, p.created_at || new Date().toISOString()
        );
      }
    }

    if (Array.isArray(t.coffee_origins) && t.coffee_origins.length > 0 && (force || countOf('coffee_origins') === 0)) {
      const upsertOrig = db.prepare(`
        INSERT INTO coffee_origins (
          slug, region_name_vi, region_name_en, localities_vi, localities_en,
          elevation, varieties, processing_methods, sourcing_status,
          characteristics_vi, characteristics_en, sourcing_note_vi, sourcing_note_en,
          map_x, map_y, latitude, longitude, image_key, photo_attribution, related_skus_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          region_name_vi = excluded.region_name_vi,
          region_name_en = excluded.region_name_en,
          localities_vi = excluded.localities_vi,
          localities_en = excluded.localities_en,
          elevation = excluded.elevation,
          varieties = excluded.varieties,
          processing_methods = excluded.processing_methods,
          sourcing_status = excluded.sourcing_status,
          characteristics_vi = excluded.characteristics_vi,
          characteristics_en = excluded.characteristics_en,
          sourcing_note_vi = excluded.sourcing_note_vi,
          sourcing_note_en = excluded.sourcing_note_en,
          map_x = excluded.map_x,
          map_y = excluded.map_y,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          image_key = excluded.image_key,
          photo_attribution = excluded.photo_attribution,
          related_skus_json = excluded.related_skus_json
      `);
      for (const o of t.coffee_origins) {
        upsertOrig.run(
          o.slug, o.region_name_vi, o.region_name_en, o.localities_vi, o.localities_en,
          o.elevation, o.varieties, o.processing_methods, o.sourcing_status,
          o.characteristics_vi, o.characteristics_en, o.sourcing_note_vi, o.sourcing_note_en,
          o.map_x, o.map_y, o.latitude, o.longitude, o.image_key, o.photo_attribution, o.related_skus_json || '[]'
        );
      }
    }

    if (Array.isArray(t.personalities) && t.personalities.length > 0 && (force || countOf('personalities') === 0)) {
      const upsertPers = db.prepare(`
        INSERT INTO personalities (
          slug, animal_en, animal_vi, traits_vi, traits_en, story_vi, story_en,
          product_association_vi, product_association_en, associated_product_slug,
          is_future_collection, image_key, custom_image_url, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          animal_en = excluded.animal_en,
          animal_vi = excluded.animal_vi,
          traits_vi = excluded.traits_vi,
          traits_en = excluded.traits_en,
          story_vi = excluded.story_vi,
          story_en = excluded.story_en,
          product_association_vi = excluded.product_association_vi,
          product_association_en = excluded.product_association_en,
          associated_product_slug = excluded.associated_product_slug,
          is_future_collection = excluded.is_future_collection,
          image_key = excluded.image_key,
          custom_image_url = excluded.custom_image_url,
          sort_order = excluded.sort_order
      `);
      for (const m of t.personalities) {
        upsertPers.run(
          m.slug, m.animal_en, m.animal_vi, m.traits_vi, m.traits_en, m.story_vi, m.story_en,
          m.product_association_vi, m.product_association_en, m.associated_product_slug || '',
          m.is_future_collection || 0, m.image_key, m.custom_image_url || '', m.sort_order || 0
        );
      }
    }

    if (Array.isArray(t.cms_pages) && t.cms_pages.length > 0 && (force || countOf('cms_pages') === 0)) {
      const upsertPage = db.prepare(`
        INSERT INTO cms_pages (
          slug, route_path, group_name, eyebrow_vi, eyebrow_en, title_vi, title_en,
          subtitle_vi, subtitle_en, body_vi, body_en, hero_image_key,
          cta_label_vi, cta_label_en, cta_url, sections_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          route_path = excluded.route_path,
          group_name = excluded.group_name,
          eyebrow_vi = excluded.eyebrow_vi,
          eyebrow_en = excluded.eyebrow_en,
          title_vi = excluded.title_vi,
          title_en = excluded.title_en,
          subtitle_vi = excluded.subtitle_vi,
          subtitle_en = excluded.subtitle_en,
          body_vi = excluded.body_vi,
          body_en = excluded.body_en,
          hero_image_key = excluded.hero_image_key,
          cta_label_vi = excluded.cta_label_vi,
          cta_label_en = excluded.cta_label_en,
          cta_url = excluded.cta_url,
          sections_json = excluded.sections_json,
          updated_at = excluded.updated_at
      `);
      for (const pg of t.cms_pages) {
        upsertPage.run(
          pg.slug, pg.route_path, pg.group_name || 'story', pg.eyebrow_vi || '', pg.eyebrow_en || '',
          pg.title_vi || '', pg.title_en || '', pg.subtitle_vi || '', pg.subtitle_en || '',
          pg.body_vi || '', pg.body_en || '', pg.hero_image_key || '',
          pg.cta_label_vi || '', pg.cta_label_en || '', pg.cta_url || '',
          pg.sections_json || '[]', pg.updated_at || new Date().toISOString()
        );
      }
    }

    if (Array.isArray(t.journal_articles) && t.journal_articles.length > 0 && (force || countOf('journal_articles') === 0)) {
      const upsertArt = db.prepare(`
        INSERT INTO journal_articles (
          slug, category, tags_json, title_vi, title_en, excerpt_vi, excerpt_en,
          content_vi, content_en, author, read_minutes, image_key, published, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          category = excluded.category,
          tags_json = excluded.tags_json,
          title_vi = excluded.title_vi,
          title_en = excluded.title_en,
          excerpt_vi = excluded.excerpt_vi,
          excerpt_en = excluded.excerpt_en,
          content_vi = excluded.content_vi,
          content_en = excluded.content_en,
          author = excluded.author,
          read_minutes = excluded.read_minutes,
          image_key = excluded.image_key,
          published = excluded.published
      `);
      for (const a of t.journal_articles) {
        upsertArt.run(
          a.slug, a.category, a.tags_json || '[]', a.title_vi, a.title_en, a.excerpt_vi, a.excerpt_en,
          a.content_vi, a.content_en, a.author, a.read_minutes || 4, a.image_key || 'hero_roar_coffee',
          a.published ?? 1, a.published_at || new Date().toISOString()
        );
      }
    }

    if (Array.isArray(t.promotions) && t.promotions.length > 0 && (force || countOf('promotions') === 0)) {
      const upsertPromo = db.prepare(`
        INSERT INTO promotions (
          code, title_vi, title_en, description_vi, description_en,
          promo_type, discount_type, discount_value, max_discount, min_order_value,
          eligible_category, start_date, end_date, usage_limit, used_count,
          per_customer_limit, combinable, member_only, min_tier, terms_vi, terms_en, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(code) DO UPDATE SET
          title_vi = excluded.title_vi,
          title_en = excluded.title_en,
          description_vi = excluded.description_vi,
          description_en = excluded.description_en,
          discount_type = excluded.discount_type,
          discount_value = excluded.discount_value,
          max_discount = excluded.max_discount,
          min_order_value = excluded.min_order_value,
          eligible_category = excluded.eligible_category,
          start_date = excluded.start_date,
          end_date = excluded.end_date,
          usage_limit = excluded.usage_limit,
          active = excluded.active
      `);
      for (const pr of t.promotions) {
        upsertPromo.run(
          pr.code, pr.title_vi, pr.title_en, pr.description_vi || '', pr.description_en || '',
          pr.promo_type || 'seasonal', pr.discount_type || 'percent', pr.discount_value || 0,
          pr.max_discount || 0, pr.min_order_value || 0, pr.eligible_category || 'all',
          pr.start_date, pr.end_date, pr.usage_limit || 1000, pr.used_count || 0,
          pr.per_customer_limit || 1, pr.combinable || 0, pr.member_only || 0, pr.min_tier || '',
          pr.terms_vi || '', pr.terms_en || '', pr.active ?? 1
        );
      }
    }

    if (Array.isArray(t.site_settings) && t.site_settings.length > 0 && (force || countOf('site_settings') === 0)) {
      const upsertSetting = db.prepare(`
        INSERT INTO site_settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `);
      for (const s of t.site_settings) {
        upsertSetting.run(s.key, String(s.value ?? ''));
      }
    }

    if (Array.isArray(t.media_assets) && t.media_assets.length > 0 && (force || countOf('media_assets') === 0)) {
      const upsertMedia = db.prepare(`
        INSERT OR IGNORE INTO media_assets (filename, url, title, alt_text, mime_type, size_bytes, source_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const ma of t.media_assets) {
        upsertMedia.run(
          ma.filename, ma.url, ma.title || '', ma.alt_text || '', ma.mime_type || 'image/jpeg',
          ma.size_bytes || 0, ma.source_type || 'uploaded', ma.created_at || new Date().toISOString()
        );
      }
    }
  });

  runTx();
  return true;
}
