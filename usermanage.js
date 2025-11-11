#!/usr/bin/env node
/**
 * User Management Script for OAFRWP
 * Manages users in SQLite database with password hashing compatible with Node.js crypto.scryptSync
 * 
 * Usage:
 *   node usermanage.js adduser username:password
 *   node usermanage.js changepass username:newpassword
 *   node usermanage.js remove username
 *   node usermanage.js list
 */

import * as db from './db.js'
import crypto from 'crypto'

// Hash password using the same scheme as app.js
function hashPass(password) {
	const salt = crypto.randomBytes(16)
	const hash = crypto.scryptSync(password, salt, 64)
	return `script:${salt.toString('hex')}:${hash.toString('hex')}`
}

// Verify password against stored hash
function verifyPass(password, stored) {
	const [scheme, saltHex, hashHex] = String(stored).split(":")

	if (scheme !== 'script') return false

	const salt = Buffer.from(saltHex, 'hex')
	const hash = Buffer.from(hashHex, 'hex')
	const test = crypto.scryptSync(password, salt, hash.length)

	return (test.length === hash.length && crypto.timingSafeEqual(hash, test))
}

// Add user to database
async function addUser(username, password) {
	try {
		// Check if user already exists
		const existingUser = await db.getUserById(username)
		if (existingUser) {
			console.error(`Error: User '${username}' already exists`)
			return false
		}

		// Hash the password
		const passHash = hashPass(password)

		// Add user to database
		await db.addUser(username, passHash)
		console.log(`Successfully added user '${username}' to database`)
		return true
	} catch (error) {
		console.error(`Error adding user: ${error.message}`)
		return false
	}
}

// Change password for existing user
async function changePassword(username, newPassword) {
	try {
		// Check if user exists
		const existingUser = await db.getUserById(username)
		if (!existingUser) {
			console.error(`Error: User '${username}' not found`)
			return false
		}

		// Hash the new password
		const newPassHash = hashPass(newPassword)

		// Update user in database using runQueryHelper
		await db.runQueryHelper(`UPDATE credentials SET pass_hashed = ? WHERE id = ?`, [newPassHash, username])
		console.log(`Successfully changed password for user '${username}'`)
		return true
	} catch (error) {
		console.error(`Error changing password: ${error.message}`)
		return false
	}
}

// Remove user from database
async function removeUser(username) {
	try {
		// Check if user exists
		const existingUser = await db.getUserById(username)
		if (!existingUser) {
			console.error(`Error: User '${username}' not found`)
			return false
		}

		// Remove user from database using runQueryHelper
		await db.runQueryHelper(`DELETE FROM credentials WHERE id = ?`, [username])
		console.log(`Successfully removed user '${username}'`)
		return true
	} catch (error) {
		console.error(`Error removing user: ${error.message}`)
		return false
	}
}

// List all users
async function listUsers() {
	try {
		const users = await db.getAllUsers()
		
		if (users.length === 0) {
			console.log('No users found in database')
			return
		}

		console.log('Users in database:')
		users.forEach(user => {
			console.log(`  - ${user.id}`)
		})
	} catch (error) {
		console.error(`Error listing users: ${error.message}`)
	}
}

// Main function
async function main() {
	const args = process.argv.slice(2)

	if (args.length === 0) {
		console.error('Error: No command specified')
		printUsage()
		process.exit(1)
	}

	const command = args[0]

	// Initialize database connection
	try {
		await db.initDatabase()
	} catch (error) {
		console.error(`Error initializing database: ${error.message}`)
		process.exit(1)
	}

	if (command === 'adduser') {
		if (args.length < 2) {
			console.error('Error: Username:password required for adduser command')
			console.error('Usage: node usermanage.js adduser username:password')
			process.exit(1)
		}

		const credentials = args[1]
		if (!credentials.includes(':')) {
			console.error("Error: Credentials must be in format 'username:password'")
			process.exit(1)
		}

		const [username, password] = credentials.split(':', 2)

		if (!username || !password) {
			console.error('Error: Both username and password are required')
			process.exit(1)
		}

		const success = await addUser(username, password)
		process.exit(success ? 0 : 1)

	} else if (command === 'changepass') {
		if (args.length < 2) {
			console.error('Error: Username:newpassword required for changepass command')
			console.error('Usage: node usermanage.js changepass username:newpassword')
			process.exit(1)
		}

		const credentials = args[1]
		if (!credentials.includes(':')) {
			console.error("Error: Credentials must be in format 'username:newpassword'")
			process.exit(1)
		}

		const [username, newPassword] = credentials.split(':', 2)

		if (!username || !newPassword) {
			console.error('Error: Both username and new password are required')
			process.exit(1)
		}

		const success = await changePassword(username, newPassword)
		process.exit(success ? 0 : 1)

	} else if (command === 'remove') {
		if (args.length < 2) {
			console.error('Error: Username required for remove command')
			console.error('Usage: node usermanage.js remove username')
			process.exit(1)
		}

		const username = args[1].trim()

		if (!username) {
			console.error('Error: Username is required')
			process.exit(1)
		}

		const success = await removeUser(username)
		process.exit(success ? 0 : 1)

	} else if (command === 'list') {
		await listUsers()
		process.exit(0)

	} else {
		console.error(`Error: Unknown command '${command}'`)
		printUsage()
		process.exit(1)
	}
}

function printUsage() {
	console.log('\nUser Management Script for OAFRWP')
	console.log('\nUsage:')
	console.log('  node usermanage.js adduser username:password')
	console.log('  node usermanage.js changepass username:newpassword')
	console.log('  node usermanage.js remove username')
	console.log('  node usermanage.js list')
	console.log('\nExamples:')
	console.log('  node usermanage.js adduser admin:secret123')
	console.log('  node usermanage.js changepass admin:newsecret123')
	console.log('  node usermanage.js remove olduser')
	console.log('  node usermanage.js list')
}

// Run main function
main().catch((error) => {
	console.error('Fatal error:', error.message)
	process.exit(1)
})

