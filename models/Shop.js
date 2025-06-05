/**
 * Shop entity model for Snowfun Nepal application
 * 
 * This model represents retail shops/outlets where freezers are placed.
 * Each shop belongs to a dealer and can have multiple fridges and visit records.
 * Includes geographical coordinates for map display.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index
} from 'typeorm';
import Dealer from './Dealer.js';
import Fridge from './Fridge.js';
import Visit from './Visit.js';

@Entity('shops')
class Shop {
  @PrimaryGeneratedColumn()
  id;

  @Column({
    name: 'dealer_id',
    nullable: false
  })
  dealerId;

  @ManyToOne(() => Dealer, dealer => dealer.shops, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'dealer_id' })
  dealer;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: false
  })
  name;

  @Column({
    name: 'address_text',
    type: 'text',
    nullable: true
  })
  addressText;

  @Column({
    type: 'decimal',
    precision: 9,
    scale: 6,
    nullable: false
  })
  @Index()
  latitude;

  @Column({
    type: 'decimal',
    precision: 9,
    scale: 6,
    nullable: false
  })
  @Index()
  longitude;

  @Column({
    name: 'contact_name',
    type: 'varchar',
    length: 120,
    nullable: true
  })
  contactName;

  @Column({
    name: 'contact_phone',
    type: 'varchar',
    length: 30,
    nullable: true
  })
  contactPhone;

  @OneToMany(() => Fridge, fridge => fridge.shop)
  fridges;

  @OneToMany(() => Visit, visit => visit.shop)
  visits;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  createdAt;

  /**
   * Calculate the distance from this shop to a given coordinate
   * @param {number} lat - Latitude to compare with
   * @param {number} lng - Longitude to compare with
   * @returns {number} Distance in kilometers
   */
  distanceFrom(lat, lng) {
    // Simple Haversine formula implementation
    const R = 6371; // Earth radius in km
    const dLat = this.toRadians(lat - this.latitude);
    const dLng = this.toRadians(lng - this.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(this.latitude)) * Math.cos(this.toRadians(lat)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @private
   * @param {number} degrees - Angle in degrees
   * @returns {number} Angle in radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get the latest visit status for this shop
   * @returns {Promise<Object|null>} Latest visit or null if never visited
   */
  async getLatestVisit() {
    if (!this.visits || this.visits.length === 0) {
      return null;
    }
    
    // If visits are already loaded, find the most recent one
    return this.visits.reduce((latest, current) => {
      return new Date(current.visitDate) > new Date(latest.visitDate) ? current : latest;
    }, this.visits[0]);
  }

  /**
   * Get the count of fridges by status
   * @returns {Object} Count of fridges by status
   */
  getFridgeStatusCounts() {
    if (!this.fridges || this.fridges.length === 0) {
      return { working: 0, repair: 0, missing: 0, total: 0 };
    }

    return this.fridges.reduce((counts, fridge) => {
      counts[fridge.status] = (counts[fridge.status] || 0) + 1;
      counts.total += 1;
      return counts;
    }, { working: 0, repair: 0, missing: 0, total: 0 });
  }
}

export default Shop;
