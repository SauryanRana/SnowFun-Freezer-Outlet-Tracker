/**
 * FridgeModel entity model for Snowfun Nepal application
 * 
 * This model represents different freezer models available in the system.
 * Each model belongs to a brand and type, and can be associated with multiple
 * physical fridge instances.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique
} from 'typeorm';
import FridgeBrand from './FridgeBrand.js';
import FridgeType from './FridgeType.js';
import Fridge from './Fridge.js';

@Entity('fridge_models')
@Unique(['brandId', 'modelName'])
class FridgeModel {
  @PrimaryGeneratedColumn()
  id;

  @Column({
    name: 'brand_id',
    nullable: false
  })
  brandId;

  @ManyToOne(() => FridgeBrand, brand => brand.models)
  @JoinColumn({ name: 'brand_id' })
  brand;

  @Column({
    name: 'model_name',
    type: 'varchar',
    length: 80,
    nullable: false
  })
  modelName;

  @Column({
    name: 'size_litre',
    type: 'int',
    nullable: true
  })
  sizeLitre;

  @Column({
    name: 'type_id',
    nullable: false
  })
  typeId;

  @ManyToOne(() => FridgeType, type => type.models)
  @JoinColumn({ name: 'type_id' })
  type;

  @OneToMany(() => Fridge, fridge => fridge.model)
  fridges;

  /**
   * Get the full model description including brand and size
   * @returns {string} Formatted model description
   */
  getFullDescription() {
    const brandName = this.brand ? this.brand.brandName : 'Unknown';
    const sizeText = this.sizeLitre ? `${this.sizeLitre}L` : '';
    
    return `${brandName} ${this.modelName} ${sizeText}`.trim();
  }

  /**
   * Get the count of active fridges using this model
   * @returns {Promise<number>} Count of active fridges
   */
  async getActiveCount() {
    if (!this.fridges) return 0;
    
    return this.fridges.filter(fridge => fridge.status === 'working').length;
  }

  /**
   * Get the type name of this fridge model
   * @returns {string} Type name or 'Unknown'
   */
  getTypeName() {
    return this.type ? this.type.typeName : 'Unknown';
  }
}

export default FridgeModel;
