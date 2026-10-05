-- TERNUS relational schema v2. Reference only; use the migration tool to copy/verify/activate data.
CREATE TABLE IF NOT EXISTS `ternus_storage` (`id` TINYINT PRIMARY KEY, `schema_version` INT NOT NULL, `mode` VARCHAR(20) NOT NULL, `revision` BIGINT NOT NULL DEFAULT 0, `migrated_at` VARCHAR(40) NULL, `source_version` BIGINT NULL, `source_sha256` CHAR(64) NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `name` LONGTEXT NULL,
  `email` VARCHAR(254) NULL,
  `password_hash` VARCHAR(255) COLLATE utf8mb4_bin NULL,
  `role` VARCHAR(190) NULL,
  `active` TINYINT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  UNIQUE (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `locations` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `name` LONGTEXT NULL,
  `active` TINYINT NULL,
  `version` BIGINT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sku_terms` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `name` LONGTEXT NULL,
  `active` TINYINT NULL,
  `version` BIGINT NULL,
  `code` VARCHAR(190) NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `name` LONGTEXT NULL,
  `active` TINYINT NULL,
  `version` BIGINT NULL,
  `sku` VARCHAR(190) NULL,
  `unit` VARCHAR(190) NULL,
  `stage` LONGTEXT NULL,
  `cost` BIGINT NULL,
  `price` BIGINT NULL,
  `minimum` BIGINT NULL,
  `net_g` BIGINT NULL,
  `sell` TINYINT NULL,
  `process` TINYINT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  UNIQUE (`sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customers` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `name` LONGTEXT NULL,
  `active` TINYINT NULL,
  `version` BIGINT NULL,
  `phone` LONGTEXT NULL,
  `address` LONGTEXT NULL,
  `kind` LONGTEXT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `suppliers` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `name` LONGTEXT NULL,
  `active` TINYINT NULL,
  `version` BIGINT NULL,
  `phone` LONGTEXT NULL,
  `address` LONGTEXT NULL,
  `kind` LONGTEXT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stock_batches` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `number` VARCHAR(190) NULL,
  `product` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `initial_qty` BIGINT NULL,
  `cost` BIGINT NULL,
  `pending` TINYINT NULL,
  `source` LONGTEXT NULL,
  `date` VARCHAR(10) NULL,
  `document` VARCHAR(190) NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`product`),
  FOREIGN KEY (`product`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  UNIQUE (`number`),
  INDEX (`date`),
  INDEX (`document`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `receipts` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `number` VARCHAR(190) NULL,
  `date` VARCHAR(10) NULL,
  `created_at` VARCHAR(40) NULL,
  `by` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `by_name` LONGTEXT NULL,
  `source` LONGTEXT NULL,
  `location` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `status` VARCHAR(190) NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`by`),
  FOREIGN KEY (`by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX (`location`),
  FOREIGN KEY (`location`) REFERENCES `locations` (`id`) ON DELETE RESTRICT,
  UNIQUE (`number`),
  INDEX (`date`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `productions` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `number` VARCHAR(190) NULL,
  `date` VARCHAR(10) NULL,
  `created_at` VARCHAR(40) NULL,
  `by` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `by_name` LONGTEXT NULL,
  `location` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `kind` LONGTEXT NULL,
  `status` VARCHAR(190) NULL,
  `cost` BIGINT NULL,
  `pending` TINYINT NULL,
  `finished` VARCHAR(10) NULL,
  `extra` BIGINT NULL,
  `loss` BIGINT NULL,
  `input_mass` BIGINT NULL,
  `note` LONGTEXT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`by`),
  FOREIGN KEY (`by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX (`location`),
  FOREIGN KEY (`location`) REFERENCES `locations` (`id`) ON DELETE RESTRICT,
  UNIQUE (`number`),
  INDEX (`date`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transfers` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `number` VARCHAR(190) NULL,
  `date` VARCHAR(10) NULL,
  `created_at` VARCHAR(40) NULL,
  `by` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `by_name` LONGTEXT NULL,
  `from` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `to` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `status` VARCHAR(190) NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`by`),
  FOREIGN KEY (`by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX (`from`),
  FOREIGN KEY (`from`) REFERENCES `locations` (`id`) ON DELETE RESTRICT,
  INDEX (`to`),
  FOREIGN KEY (`to`) REFERENCES `locations` (`id`) ON DELETE RESTRICT,
  UNIQUE (`number`),
  INDEX (`date`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quotes` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `number` VARCHAR(190) NULL,
  `date` VARCHAR(10) NULL,
  `created_at` VARCHAR(40) NULL,
  `by` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `by_name` LONGTEXT NULL,
  `customer` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `customer_name` LONGTEXT NULL,
  `address` LONGTEXT NULL,
  `location` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `shipping` BIGINT NULL,
  `total` BIGINT NULL,
  `status` VARCHAR(190) NULL,
  `valid_until` VARCHAR(10) NULL,
  `order` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`by`),
  FOREIGN KEY (`by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX (`customer`),
  FOREIGN KEY (`customer`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  INDEX (`location`),
  FOREIGN KEY (`location`) REFERENCES `locations` (`id`) ON DELETE RESTRICT,
  UNIQUE (`number`),
  INDEX (`date`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sales_orders` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `number` VARCHAR(190) NULL,
  `date` VARCHAR(10) NULL,
  `created_at` VARCHAR(40) NULL,
  `by` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `by_name` LONGTEXT NULL,
  `customer` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `customer_name` LONGTEXT NULL,
  `address` LONGTEXT NULL,
  `location` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `shipping` BIGINT NULL,
  `total` BIGINT NULL,
  `status` VARCHAR(190) NULL,
  `quote` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`by`),
  FOREIGN KEY (`by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX (`customer`),
  FOREIGN KEY (`customer`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  INDEX (`location`),
  FOREIGN KEY (`location`) REFERENCES `locations` (`id`) ON DELETE RESTRICT,
  INDEX (`quote`),
  FOREIGN KEY (`quote`) REFERENCES `quotes` (`id`) ON DELETE RESTRICT,
  UNIQUE (`number`),
  INDEX (`date`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `shipments` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `number` VARCHAR(190) NULL,
  `date` VARCHAR(10) NULL,
  `created_at` VARCHAR(40) NULL,
  `by` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `by_name` LONGTEXT NULL,
  `order` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `customer_name` LONGTEXT NULL,
  `location` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `status` VARCHAR(190) NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`by`),
  FOREIGN KEY (`by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX (`order`),
  FOREIGN KEY (`order`) REFERENCES `sales_orders` (`id`) ON DELETE RESTRICT,
  INDEX (`location`),
  FOREIGN KEY (`location`) REFERENCES `locations` (`id`) ON DELETE RESTRICT,
  UNIQUE (`number`),
  INDEX (`date`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `invoices` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `number` VARCHAR(190) NULL,
  `date` VARCHAR(10) NULL,
  `created_at` VARCHAR(40) NULL,
  `by` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `by_name` LONGTEXT NULL,
  `order` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `customer` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `customer_name` LONGTEXT NULL,
  `address` LONGTEXT NULL,
  `shipping` BIGINT NULL,
  `total` BIGINT NULL,
  `status` VARCHAR(190) NULL,
  `due` VARCHAR(10) NULL,
  `company` LONGTEXT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`by`),
  FOREIGN KEY (`by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX (`order`),
  FOREIGN KEY (`order`) REFERENCES `sales_orders` (`id`) ON DELETE RESTRICT,
  INDEX (`customer`),
  FOREIGN KEY (`customer`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  UNIQUE (`number`),
  UNIQUE (`order`),
  INDEX (`date`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `number` VARCHAR(190) NULL,
  `date` VARCHAR(10) NULL,
  `created_at` VARCHAR(40) NULL,
  `by` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `by_name` LONGTEXT NULL,
  `invoice` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `amount` BIGINT NULL,
  `note` LONGTEXT NULL,
  `method` LONGTEXT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`by`),
  FOREIGN KEY (`by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX (`invoice`),
  FOREIGN KEY (`invoice`) REFERENCES `invoices` (`id`) ON DELETE RESTRICT,
  UNIQUE (`number`),
  INDEX (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `credit_notes` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `number` VARCHAR(190) NULL,
  `date` VARCHAR(10) NULL,
  `created_at` VARCHAR(40) NULL,
  `by` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `by_name` LONGTEXT NULL,
  `invoice` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `amount` BIGINT NULL,
  `note` LONGTEXT NULL,
  `method` LONGTEXT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`by`),
  FOREIGN KEY (`by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX (`invoice`),
  FOREIGN KEY (`invoice`) REFERENCES `invoices` (`id`) ON DELETE RESTRICT,
  UNIQUE (`number`),
  INDEX (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `refunds` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `number` VARCHAR(190) NULL,
  `date` VARCHAR(10) NULL,
  `created_at` VARCHAR(40) NULL,
  `by` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `by_name` LONGTEXT NULL,
  `invoice` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `amount` BIGINT NULL,
  `note` LONGTEXT NULL,
  `method` LONGTEXT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`by`),
  FOREIGN KEY (`by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX (`invoice`),
  FOREIGN KEY (`invoice`) REFERENCES `invoices` (`id`) ON DELETE RESTRICT,
  UNIQUE (`number`),
  INDEX (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sales_returns` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `number` VARCHAR(190) NULL,
  `date` VARCHAR(10) NULL,
  `created_at` VARCHAR(40) NULL,
  `by` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `by_name` LONGTEXT NULL,
  `shipment` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `location` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `status` VARCHAR(190) NULL,
  `note` LONGTEXT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`by`),
  FOREIGN KEY (`by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX (`shipment`),
  FOREIGN KEY (`shipment`) REFERENCES `shipments` (`id`) ON DELETE RESTRICT,
  INDEX (`location`),
  FOREIGN KEY (`location`) REFERENCES `locations` (`id`) ON DELETE RESTRICT,
  UNIQUE (`number`),
  INDEX (`date`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stocktakes` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `number` VARCHAR(190) NULL,
  `date` VARCHAR(10) NULL,
  `created_at` VARCHAR(40) NULL,
  `by` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `by_name` LONGTEXT NULL,
  `location` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `status` VARCHAR(190) NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`by`),
  FOREIGN KEY (`by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX (`location`),
  FOREIGN KEY (`location`) REFERENCES `locations` (`id`) ON DELETE RESTRICT,
  UNIQUE (`number`),
  INDEX (`date`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `office_assets` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `number` VARCHAR(190) NULL,
  `date` VARCHAR(10) NULL,
  `created_at` VARCHAR(40) NULL,
  `by` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `by_name` LONGTEXT NULL,
  `name` LONGTEXT NULL,
  `serial` LONGTEXT NULL,
  `location` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `pic` LONGTEXT NULL,
  `cost` BIGINT NULL,
  `condition` LONGTEXT NULL,
  `status` VARCHAR(190) NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`by`),
  FOREIGN KEY (`by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX (`location`),
  FOREIGN KEY (`location`) REFERENCES `locations` (`id`) ON DELETE RESTRICT,
  UNIQUE (`number`),
  INDEX (`date`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `asset_events` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `number` VARCHAR(190) NULL,
  `date` VARCHAR(10) NULL,
  `created_at` VARCHAR(40) NULL,
  `by` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `by_name` LONGTEXT NULL,
  `asset` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `event` VARCHAR(190) NULL,
  `note` LONGTEXT NULL,
  `before` LONGTEXT NULL,
  `after` LONGTEXT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`by`),
  FOREIGN KEY (`by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX (`asset`),
  FOREIGN KEY (`asset`) REFERENCES `office_assets` (`id`) ON DELETE RESTRICT,
  UNIQUE (`number`),
  INDEX (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stock_movements` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `batch` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `product` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `location` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `bucket` VARCHAR(190) NULL,
  `qty` BIGINT NULL,
  `date` VARCHAR(10) NULL,
  `time` VARCHAR(40) NULL,
  `document` VARCHAR(190) NULL,
  `document_id` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `kind` LONGTEXT NULL,
  `by` LONGTEXT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`batch`),
  FOREIGN KEY (`batch`) REFERENCES `stock_batches` (`id`) ON DELETE RESTRICT,
  INDEX (`product`),
  FOREIGN KEY (`product`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  INDEX (`location`),
  FOREIGN KEY (`location`) REFERENCES `locations` (`id`) ON DELETE RESTRICT,
  INDEX (`date`),
  INDEX (`time`),
  INDEX (`document`),
  INDEX (`document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `sort_order` BIGINT NOT NULL,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `time` VARCHAR(40) NULL,
  `user` LONGTEXT NULL,
  `user_id` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `role` VARCHAR(190) NULL,
  `op` VARCHAR(190) NULL,
  `document` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `summary` LONGTEXT NULL,
  `schema` BIGINT NULL,
  `source` VARCHAR(190) NULL,
  `changes` LONGTEXT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`time`),
  INDEX (`op`),
  INDEX (`document`),
  INDEX (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `batch_parents` (
  `parent_id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  `line_no` BIGINT NOT NULL,
  PRIMARY KEY (`parent_id`,`line_no`),
  FOREIGN KEY (`parent_id`) REFERENCES `stock_batches` (`id`) ON DELETE RESTRICT,
  `batch` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `qty` BIGINT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`batch`),
  FOREIGN KEY (`batch`) REFERENCES `stock_batches` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `receipt_items` (
  `parent_id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  `line_no` BIGINT NOT NULL,
  PRIMARY KEY (`parent_id`,`line_no`),
  FOREIGN KEY (`parent_id`) REFERENCES `receipts` (`id`) ON DELETE RESTRICT,
  `product` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `batch` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `qty` BIGINT NULL,
  `cost` BIGINT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`product`),
  FOREIGN KEY (`product`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  INDEX (`batch`),
  FOREIGN KEY (`batch`) REFERENCES `stock_batches` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_inputs` (
  `parent_id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  `line_no` BIGINT NOT NULL,
  PRIMARY KEY (`parent_id`,`line_no`),
  FOREIGN KEY (`parent_id`) REFERENCES `productions` (`id`) ON DELETE RESTRICT,
  `batch` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `product` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `qty` BIGINT NULL,
  `cost` BIGINT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`batch`),
  FOREIGN KEY (`batch`) REFERENCES `stock_batches` (`id`) ON DELETE RESTRICT,
  INDEX (`product`),
  FOREIGN KEY (`product`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_outputs` (
  `parent_id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  `line_no` BIGINT NOT NULL,
  PRIMARY KEY (`parent_id`,`line_no`),
  FOREIGN KEY (`parent_id`) REFERENCES `productions` (`id`) ON DELETE RESTRICT,
  `batch` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `product` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `qty` BIGINT NULL,
  `cost` BIGINT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`batch`),
  FOREIGN KEY (`batch`) REFERENCES `stock_batches` (`id`) ON DELETE RESTRICT,
  INDEX (`product`),
  FOREIGN KEY (`product`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transfer_items` (
  `parent_id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  `line_no` BIGINT NOT NULL,
  PRIMARY KEY (`parent_id`,`line_no`),
  FOREIGN KEY (`parent_id`) REFERENCES `transfers` (`id`) ON DELETE RESTRICT,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `batch` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `qty` BIGINT NULL,
  `received` BIGINT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`batch`),
  FOREIGN KEY (`batch`) REFERENCES `stock_batches` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quote_items` (
  `parent_id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  `line_no` BIGINT NOT NULL,
  PRIMARY KEY (`parent_id`,`line_no`),
  FOREIGN KEY (`parent_id`) REFERENCES `quotes` (`id`) ON DELETE RESTRICT,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `product` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `name` LONGTEXT NULL,
  `sku` VARCHAR(190) NULL,
  `unit` VARCHAR(190) NULL,
  `qty` BIGINT NULL,
  `price` BIGINT NULL,
  `discount` BIGINT NULL,
  `net` BIGINT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`product`),
  FOREIGN KEY (`product`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `parent_id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  `line_no` BIGINT NOT NULL,
  PRIMARY KEY (`parent_id`,`line_no`),
  FOREIGN KEY (`parent_id`) REFERENCES `sales_orders` (`id`) ON DELETE RESTRICT,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `product` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `name` LONGTEXT NULL,
  `sku` VARCHAR(190) NULL,
  `unit` VARCHAR(190) NULL,
  `qty` BIGINT NULL,
  `price` BIGINT NULL,
  `discount` BIGINT NULL,
  `net` BIGINT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`product`),
  FOREIGN KEY (`product`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_allocations` (
  `parent_id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  `line_no` BIGINT NOT NULL,
  PRIMARY KEY (`parent_id`,`line_no`),
  FOREIGN KEY (`parent_id`) REFERENCES `sales_orders` (`id`) ON DELETE RESTRICT,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `line` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `batch` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `remaining` BIGINT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`batch`),
  FOREIGN KEY (`batch`) REFERENCES `stock_batches` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `shipment_items` (
  `parent_id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  `line_no` BIGINT NOT NULL,
  PRIMARY KEY (`parent_id`,`line_no`),
  FOREIGN KEY (`parent_id`) REFERENCES `shipments` (`id`) ON DELETE RESTRICT,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `batch` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `product` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `qty` BIGINT NULL,
  `returned` BIGINT NULL,
  `cost` BIGINT NULL,
  `net` BIGINT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`batch`),
  FOREIGN KEY (`batch`) REFERENCES `stock_batches` (`id`) ON DELETE RESTRICT,
  INDEX (`product`),
  FOREIGN KEY (`product`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `invoice_items` (
  `parent_id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  `line_no` BIGINT NOT NULL,
  PRIMARY KEY (`parent_id`,`line_no`),
  FOREIGN KEY (`parent_id`) REFERENCES `invoices` (`id`) ON DELETE RESTRICT,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `product` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `name` LONGTEXT NULL,
  `sku` VARCHAR(190) NULL,
  `unit` VARCHAR(190) NULL,
  `qty` BIGINT NULL,
  `price` BIGINT NULL,
  `discount` BIGINT NULL,
  `net` BIGINT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`product`),
  FOREIGN KEY (`product`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `return_items` (
  `parent_id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  `line_no` BIGINT NOT NULL,
  PRIMARY KEY (`parent_id`,`line_no`),
  FOREIGN KEY (`parent_id`) REFERENCES `sales_returns` (`id`) ON DELETE RESTRICT,
  `batch` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `qty` BIGINT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`batch`),
  FOREIGN KEY (`batch`) REFERENCES `stock_batches` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stocktake_items` (
  `parent_id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  `line_no` BIGINT NOT NULL,
  PRIMARY KEY (`parent_id`,`line_no`),
  FOREIGN KEY (`parent_id`) REFERENCES `stocktakes` (`id`) ON DELETE RESTRICT,
  `id` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `batch` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `bucket` VARCHAR(190) NULL,
  `system` BIGINT NULL,
  `physical` BIGINT NULL,
  `reason` LONGTEXT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`batch`),
  FOREIGN KEY (`batch`) REFERENCES `stock_batches` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `app_settings` (
  `entry_key` VARCHAR(190) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `sort_order` BIGINT NOT NULL,
  `value` LONGTEXT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_sequences` (
  `entry_key` VARCHAR(190) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `sort_order` BIGINT NOT NULL,
  `value` BIGINT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `command_requests` (
  `entry_key` VARCHAR(190) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `sort_order` BIGINT NOT NULL,
  `hash` VARCHAR(190) NULL,
  `user` VARCHAR(100) COLLATE utf8mb4_bin NULL,
  `result` LONGTEXT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `login_attempts` (
  `entry_key` VARCHAR(190) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `sort_order` BIGINT NOT NULL,
  `count` BIGINT NULL,
  `time` BIGINT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL,
  INDEX (`time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `app_extensions` (
  `entry_key` VARCHAR(190) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  `sort_order` BIGINT NOT NULL,
  `value` LONGTEXT NULL,
  `_present` LONGTEXT NOT NULL,
  `_extra_json` LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
