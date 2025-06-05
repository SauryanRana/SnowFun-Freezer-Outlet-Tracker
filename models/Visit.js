/**
 * Visit entity model for Snowfun Nepal application
 * 
 * This model represents visits made by PSRs (Pilot Sales Representatives) to shops.
 * Each visit record tracks which PSR visited which shop, when the visit occurred,
 * and the status of the visit (visited/not visited).
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
  Unique
} from 'typeorm';
import Shop from './Shop.js';
import User from './User.js';

@Entity('visits')
@Unique(['shopId', 'psrId', 'visitDate']) // Prevent duplicate visits for same shop/PSR/date
@Check(`status IN ('visited', 'not_visited')`)
class Visit {
  @PrimaryGeneratedColumn()
  id;

  @Column({
    name: 'shop_id',
    nullable: false
  })
  @Index()
  shopId;

  @ManyToOne(() => Shop, shop => shop.visits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop;

  @Column({
    name: 'psr_id',
    type: 'uuid',
    nullable: false
  })
  @Index()
  psrId;

  @ManyToOne(() => User, user => user.visits)
  @JoinColumn({ name: 'psr_id' })
  psr;

  @Column({
    name: 'visit_date',
    type: 'date',
    default: () => 'CURRENT_DATE',
    nullable: false
  })
  @Index()
  visitDate;

  @Column({
    type: 'varchar',
    length: 15,
    nullable: false
  })
  status;

  @Column({
    type: 'text',
    nullable: true
  })
  notes;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  createdAt;

  /**
   * Check if the shop was successfully visited
   * @returns {boolean} True if status is 'visited'
   */
  isVisited() {
    return this.status === 'visited';
  }

  /**
   * Check if the shop was not visited
   * @returns {boolean} True if status is 'not_visited'
   */
  isNotVisited() {
    return this.status === 'not_visited';
  }

  /**
   * Get the days elapsed since this visit
   * @returns {number} Number of days since the visit
   */
  getDaysElapsed() {
    const visitDate = new Date(this.visitDate);
    const today = new Date();
    const diffTime = Math.abs(today - visitDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get status values for validation and dropdowns
   * @returns {Array<string>} Valid status values
   */
  static get STATUS_VALUES() {
    return ['visited', 'not_visited'];
  }
}

export default Visit;
