/**
 * User entity model for Snowfun Nepal application
 * 
 * This model represents users in the system with role-based access control.
 * Users can be either administrators or PSRs (Pilot Sales Representatives).
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { hash } from 'bcrypt';
import Role from './Role.js';
import Visit from './Visit.js';
import PsrAssignment from './PsrAssignment.js';

@Entity('users')
class User {
  @PrimaryGeneratedColumn('uuid')
  id;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: false
  })
  email;

  @Column({
    type: 'text',
    nullable: false,
    select: false // Don't select password_hash by default for security
  })
  password_hash;

  @Column({
    name: 'full_name',
    type: 'varchar',
    length: 120,
    nullable: false
  })
  fullName;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: true
  })
  phone;

  @Column({
    name: 'role_id',
    nullable: false
  })
  roleId;

  @ManyToOne(() => Role, role => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role;

  @OneToMany(() => PsrAssignment, psrAssignment => psrAssignment.psr)
  assignments;

  @OneToMany(() => Visit, visit => visit.psr)
  visits;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  createdAt;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  updatedAt;

  /**
   * Hash the password before inserting or updating
   */
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // Only hash the password if it's being modified
    if (this.password_hash && this.password_hash.indexOf('$2b$') !== 0) {
      const saltRounds = 10;
      this.password_hash = await hash(this.password_hash, saltRounds);
    }
  }

  /**
   * Convert entity to a safe object without sensitive data
   * @returns {Object} User data without sensitive fields
   */
  toJSON() {
    const { password_hash, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  /**
   * Check if user is an administrator
   * @returns {boolean} True if user has admin role
   */
  isAdmin() {
    return this.role?.role_name === 'admin';
  }

  /**
   * Check if user is a PSR
   * @returns {boolean} True if user has PSR role
   */
  isPsr() {
    return this.role?.role_name === 'psr';
  }
}

export default User;
