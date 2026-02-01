'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, Menu, X, Bell } from 'lucide-react'
import { motion } from 'framer-motion'
import { ThemeToggle } from './ThemeToggle'

export function Navigation() {
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <nav className="nav-glass fixed w-full top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold gradient-text">VaultZero</span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link 
            href="/demo" 
            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
          >
            Demo
          </Link>
          <Link 
            href="/status" 
            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
          >
            Status
          </Link>
          <Link 
            href="/dashboard" 
            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
          >
            Dashboard
          </Link>
          <ThemeToggle />
          <Link 
            href="/login" 
            className="btn-primary"
          >
            Entrar
          </Link>
        </div>

        {/* Menu Mobile */}
        <div className="md:hidden flex items-center space-x-3">
          <ThemeToggle />
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            aria-label="Toggle menu"
          >
            {showMobileMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {showMobileMenu && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 shadow-lg rounded-b-xl p-4 border-t border-gray-200 dark:border-gray-800 mt-0"
        >
          <div className="flex flex-col space-y-4">
            <Link 
              href="/demo" 
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors py-2"
              onClick={() => setShowMobileMenu(false)}
            >
              Demo
            </Link>
            <Link 
              href="/status" 
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors py-2"
              onClick={() => setShowMobileMenu(false)}
            >
              Status
            </Link>
            <Link 
              href="/dashboard" 
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors py-2"
              onClick={() => setShowMobileMenu(false)}
            >
              Dashboard
            </Link>
            <hr className="border-gray-200 dark:border-gray-800" />
            <Link 
              href="/login" 
              className="btn-primary w-full text-center py-2"
              onClick={() => setShowMobileMenu(false)}
            >
              Entrar
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  )
}
