import { createContext } from 'react'

/**
 * @typedef {Object} AuthContextValue
 * @property {{id:number,name:string,email:string,created_at:string}|null} user
 * @property {boolean} isAuthenticated
 * @property {boolean} isLoading  true while a saved token is being checked on page load
 * @property {(credentials:{email:string,password:string}) => Promise<void>} login
 * @property {(details:{name:string,email:string,password:string}) => Promise<void>} signup
 * @property {() => Promise<void>} logout
 */

/** @type {import('react').Context<AuthContextValue|null>} */
export const AuthContext = createContext(null)
