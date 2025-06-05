# Database Schema – Snowfun Nepal *Freezer & Outlet Tracker*

Relational model designed for PostgreSQL (but portable to any SQL RDBMS).  
❄️ = main entity 📄 = reference / lookup 🔗 = junction table

---

## 1. Entity–Relationship Diagram (textual)

```
User (1)───<(Visit)>───(∞) Shop (∞)───<(Fridge)>───(∞) FridgeModel
  │                           │
  │                           └── Dealer (1) >───< PSRAssignment >─── User[PSR]
  │
  └── Role (1)
```

* Full ER diagram with cardinalities is described table-by-table below.

---

## 2. Tables

### 2.1 ❄️ `users`
| Column          | Type           | Constraints                              | Description                           |
|-----------------|----------------|------------------------------------------|---------------------------------------|
| id              | UUID           | PK, default `uuid_generate_v4()`         | Unique user ID                        |
| email           | VARCHAR(255)   | UNIQUE, NOT NULL                         | Login credential                      |
| password_hash   | TEXT           | NOT NULL                                 | BCrypt/Argon hash                     |
| full_name       | VARCHAR(120)   | NOT NULL                                 | Person’s name                         |
| phone           | VARCHAR(30)    |                                          | Optional contact                      |
| role_id         | SMALLINT       | FK → `roles.id`, NOT NULL                | Admin / PSR                           |
| created_at      | TIMESTAMP      | DEFAULT now()                            |                                       |
| updated_at      | TIMESTAMP      | DEFAULT now()                            |                                       |

### 2.2 📄 `roles`
Seeded reference table.

| id | role_name |
|----|-----------|
| 1  | admin     |
| 2  | psr       |

### 2.3 ❄️ `dealers`
| Column       | Type         | Constraints               | Description           |
|--------------|--------------|---------------------------|-----------------------|
| id           | SERIAL       | PK                        |                       |
| name         | VARCHAR(120) | NOT NULL                  | Dealer / distributor  |
| district     | VARCHAR(80)  | NOT NULL                  | e.g. “Lalitpur”       |
| municipality | VARCHAR(120) |                           |                       |
| latitude     | DECIMAL(9,6) |                           | Centroid (optional)   |
| longitude    | DECIMAL(9,6) |                           |                       |
| created_at   | TIMESTAMP    | DEFAULT now()             |                       |

### 2.4 🔗 `psr_assignments`
Many-to-many between PSR users and dealers (or specific routes).

| Column    | Type    | Constraints                         |
|-----------|---------|-------------------------------------|
| user_id   | UUID    | PK, FK → `users.id` (must be PSR)   |
| dealer_id | INT     | PK, FK → `dealers.id`               |
| assigned_at| TIMESTAMP | DEFAULT now()                    |

### 2.5 ❄️ `shops`
| Column         | Type           | Constraints                           |
|----------------|----------------|---------------------------------------|
| id             | SERIAL         | PK                                    |
| dealer_id      | INT            | FK → `dealers.id`, NOT NULL           |
| name           | VARCHAR(150)   | NOT NULL                              |
| address_text   | TEXT           |                                       |
| latitude       | DECIMAL(9,6)   | NOT NULL                              |
| longitude      | DECIMAL(9,6)   | NOT NULL                              |
| contact_name   | VARCHAR(120)   |                                       |
| contact_phone  | VARCHAR(30)    |                                       |
| created_at     | TIMESTAMP      | DEFAULT now()                         |

**Index**:  (`dealer_id`),  GIS index on `(latitude, longitude)` if PostGIS.

### 2.6 📄 `fridge_types`
Seedable dropdown.

| id | type_name | example |
|----|-----------|---------|
| 1  | Hard Top  |         |
| 2  | Curve Glass |       |
| 3  | Side Class  |       |

### 2.7 📄 `fridge_brands`
| id | brand_name |
|----|------------|
| 1  | Snowfun    |
| 2  | CG         |
| …  | …          |

### 2.8 📄 `fridge_models`
| Column       | Type         | Constraints                        |
|--------------|--------------|------------------------------------|
| id           | SERIAL       | PK                                 |
| brand_id     | INT          | FK → `fridge_brands.id`, NOT NULL  |
| model_name   | VARCHAR(80)  | NOT NULL                           |
| size_litre   | INT          |                                    |
| type_id      | INT          | FK → `fridge_types.id`, NOT NULL   |

Unique (`brand_id`,`model_name`).

### 2.9 ❄️ `fridges`
Represents each physical freezer at a shop.

| Column          | Type          | Constraints                              |
|-----------------|---------------|------------------------------------------|
| id              | SERIAL        | PK                                       |
| shop_id         | INT           | FK → `shops.id`, NOT NULL                |
| model_id        | INT           | FK → `fridge_models.id`, NOT NULL        |
| status          | VARCHAR(20)   | CHECK (status IN ('working','repair','missing')), DEFAULT 'working' |
| contract_img_url| TEXT          |                                           |
| deposit_npr     | NUMERIC(10,2) |                                           |
| installed_at    | DATE          |                                           |
| updated_at      | TIMESTAMP     | DEFAULT now()                             |

### 2.10 ❄️ `visits`
Log each PSR visit (or attempted visit) to a shop.

| Column         | Type        | Constraints                                   |
|----------------|------------|-----------------------------------------------|
| id             | SERIAL     | PK                                            |
| shop_id        | INT        | FK → `shops.id`, NOT NULL                     |
| psr_id         | UUID       | FK → `users.id`, NOT NULL                     |
| visit_date     | DATE       | DEFAULT CURRENT_DATE                          |
| status         | VARCHAR(15)| CHECK (status IN ('visited','not_visited')), NOT NULL |
| notes          | TEXT       |                                               |
| created_at     | TIMESTAMP  | DEFAULT now()                                 |

Index (`psr_id`,`visit_date`).

### 2.11 📄 `dropdown_values`
Generic table to allow admin-editable lists (optional alternative to dedicated tables).

| id        | SERIAL | PK |
| category  | VARCHAR(40) | e.g. 'fridge_brand' |
| value     | VARCHAR(120) |
| is_active | BOOLEAN DEFAULT true |

---

## 3. Key Constraints & Rules

1. **Role enforcement**  
   Application middleware ensures only users with `roles.role_name = 'psr'` can create `visits` or be inserted in `psr_assignments`.

2. **Cascade behavior**  
   * `ON DELETE RESTRICT` for critical parent entities (dealers, shops).  
   * `ON DELETE CASCADE` from `shops → fridges` and `shops → visits`.

3. **Unique Business Rules**  
   * A shop can hold multiple fridges, but only one active visit record per shop+psr+date (enforce with UNIQUE(shop_id, psr_id, visit_date)).

---

## 4. Seed & Lookup Flow

1. Insert `roles`, `fridge_types`, `fridge_brands`, `fridge_models`.  
2. Create admin user.  
3. Admin adds dealers → shops → assigns PSRs via `psr_assignments`.  
4. PSR mobile UI pulls their shops, logs `visits`; fridge inventory updated on the fly.

---

## 5. Extension Suggestions

| Feature                 | DB Note                                     |
|-------------------------|---------------------------------------------|
| Image storage metadata  | Extra table `files` if storing more meta    |
| Repair tickets          | New table `repairs` linked to `fridges`     |
| Geo-queries             | Enable PostGIS and use `GEOGRAPHY(Point)`   |
| Audit log               | Table `activity_log` with user, action JSON |

---

**End of `db-schema.md`**
