/**
 * Fridge entity model for Snowfun Nepal application
 * 
 * This model represents physical freezer units placed in shops.
 * Each fridge has a specific model, status, and contract details.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Check
} from 'typeorm';
import Shop from './Shop.js';
import FridgeModel from './FridgeModel.js';

@Entity('fridges')
@Check(`status IN ('working', 'repair', 'missing')`)
class Fridge {
  @PrimaryGeneratedColumn()
  id;

  @Column({
    name: 'shop_id',
    nullable: false
  })
  shopId;

  @ManyToOne(() => Shop, shop => shop.fridges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop;

  @Column({
    name: 'model_id',
    nullable: false
  })
  modelId;

  @ManyToOne(() => FridgeModel, model => model.fridges)
  @JoinColumn({ name: 'model_id' })
  model;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'working',
    nullable: false
  })
  status;

  @Column({
    name: 'contract_img_url',
    type: 'text',
    nullable: true
  })
  contractImgUrl;

  @Column({
    name: 'deposit_npr',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true
  })
  depositNpr;

  @Column({
    name: 'installed_at',
    type: 'date',
    nullable: true
  })
  installedAt;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  updatedAt;

  /**
   * Check if the fridge is in working condition
   * @returns {boolean} True if status is 'working'
   */
  isWorking() {
    return this.status === 'working';
  }

  /**
   * Check if the fridge needs repair
   * @returns {boolean} True if status is 'repair'
   */
  needsRepair() {
    return this.status === 'repair';
  }

  /**
   * Check if the fridge is missing
   * @returns {boolean} True if status is 'missing'
   */
  isMissing() {
    return this.status === 'missing';
  }

  /**
   * Get the full fridge description including brand, model and size
   * @returns {string} Formatted description
   */
  getFullDescription() {
    if (!this.model) return 'Unknown Model';
    
    const brand = this.model.brand ? this.model.brand.brandName : 'Unknown';
    const size = this.model.sizeLitre ? `${this.model.sizeLitre}L` : '';
    
    return `${brand} ${this.model.modelName} ${size}`.trim();
  }

  /**
   * Get the age of the fridge installation in days
   * @returns {number|null} Days since installation or null if installation date not set
   */
  getInstallationAge() {
    if (!this.installedAt) return null;
    
    const now = new Date();
    const installed = new Date(this.installedAt);
    const diffTime = Math.abs(now - installed);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Get status values for validation and dropdowns
   * @returns {Array<string>} Valid status values
   */
  static get STATUS_VALUES() {
    return ['working', 'repair', 'missing'];
  }
}

export default Fridge;
