import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Settings, LogOut } from 'lucide-react'

interface User {
  userId: string // email
  _id: string // MongoDB _id
  firstName?: string
  lastName?: string
}

interface UserMenuProps {
  currentUser: User | null
  onLogout: () => void
}

const UserMenu: React.FC<UserMenuProps> = ({ currentUser, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLButtonElement>(null)

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev)
  }

  const closeDropdown = () => {
    setIsDropdownOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        closeDropdown()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (!currentUser) {
    return null
  }

  const userInitial = currentUser.firstName ? currentUser.firstName.charAt(0).toUpperCase() : currentUser.userId.charAt(0).toUpperCase()
  const displayName = currentUser.firstName && currentUser.lastName
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : currentUser.userId

  return (
    <div className="relative">
      <button
        ref={avatarRef}
        onClick={toggleDropdown}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600 text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
        aria-label="User menu"
      >
        {userInitial}
      </button>

      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-60 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
        >
          <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">
            <div className="font-medium">{displayName}</div>
            <div className="text-gray-500 truncate">{currentUser.userId}</div>
          </div>
          <Link
            to="/settings"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={closeDropdown}
          >
            <Settings className="w-4 h-4 mr-2 text-gray-500" />
            Paramètres
          </Link>
          <button
            onClick={() => {
              onLogout()
              closeDropdown()
            }}
            className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t border-gray-200 mt-1"
          >
            <LogOut className="w-4 h-4 mr-2 text-red-500" />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu
