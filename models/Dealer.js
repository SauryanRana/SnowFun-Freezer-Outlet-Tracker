/**
 * Dealer entity model for Snowfun Nepal application
 * 
 * This model represents dealers/distributors who are assigned to specific
 * regions in Nepal. Each dealer can have multiple shops and PSRs assigned to them.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany
} from 'typeorm';
import Shop from './Shop.js';
import PsrAssignment from './PsrAssignment.js';

@Entity('dealers')
class Dealer {
  @PrimaryGeneratedColumn()
  id;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: false
  })
  name;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: false
  })
  district;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true
  })
  municipality;

  @Column({
    type: 'decimal',
    precision: 9,
    scale: 6,
    nullable: true
  })
  latitude;

  @Column({
    type: 'decimal',
    precision: 9,
    scale: 6,
    nullable: true
  })
  longitude;

  @OneToMany(() => Shop, shop => shop.dealer)
  shops;

  @OneToMany(() => PsrAssignment, psrAssignment => psrAssignment.dealer)
  psrAssignments;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  createdAt;

  /**
   * Get all PSRs assigned to this dealer
   * @returns {Promise<User[]>} Array of PSR users
   */
  async getAssignedPsrs() {
    if (!this.psrAssignments) {
      return [];
    }
    
    return this.psrAssignments.map(assignment => assignment.psr);
  }

  /**
   * Get shop count for this dealer
   * @returns {number} Number of shops
   */
  getShopCount() {
    return this.shops ? this.shops.length : 0;
  }

  /**
   * Get total fridge count across all shops
   * @returns {number} Total number of fridges
   */
  getTotalFridgeCount() {
    if (!this.shops) return 0;
    
    return this.shops.reduce((total, shop) => {
      return total + (shop.fridges ? shop.fridges.length : 0);
    }, 0);
  }
  
  /**
   * Get geographical bounds of all shops
   * @returns {Object} Bounds object with north, south, east, west coordinates
   */
  getGeoBounds() {
    if (!this.shops || this.shops.length === 0) {
      // If no shops or coordinates available, return Nepal's approximate center
      return {
        north: 28.3949,
        south: 28.3949,
        east: 84.1240,
        west: 84.1240
      };
    }
    
    let north = -90, south = 90, east = -180, west = 180;
    
    this.shops.forEach(shop => {
      if (shop.latitude && shop.longitude) {
        north = Math.max(north, Number(shop.latitude));
        south = Math.min(south, Number(shop.latitude));
        east = Math.max(east, Number(shop.longitude));
        west = Math.min(west, Number(shop.longitude));
      }
    });
    
    return { north, south, east, west };
  }
}

export default Dealer;
