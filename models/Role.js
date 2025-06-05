/**
 * Role entity model for Snowfun Nepal application
 * 
 * This model represents user roles in the system for role-based access control.
 * Currently supported roles are 'admin' and 'psr' (Pilot Sales Representative).
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany
} from 'typeorm';
import User from './User.js';

@Entity('roles')
class Role {
  @PrimaryGeneratedColumn('smallint')
  id;

  @Column({
    name: 'role_name',
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: false
  })
  roleName;

  @OneToMany(() => User, user => user.role)
  users;

  /**
   * Check if this role is an admin role
   * @returns {boolean} True if this is an admin role
   */
  isAdmin() {
    return this.roleName === 'admin';
  }

  /**
   * Check if this role is a PSR role
   * @returns {boolean} True if this is a PSR role
   */
  isPsr() {
    return this.roleName === 'psr';
  }

  /**
   * Get predefined role IDs for seeding and lookups
   * @returns {Object} Map of role names to IDs
   */
  static get ROLES() {
    return {
      ADMIN: 1,
      PSR: 2
    };
  }
}

export default Role;
