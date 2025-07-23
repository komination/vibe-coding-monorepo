"use client"

import { signIn } from "next-auth/react"

export interface ServerActionError {
  type: "authentication" | "authorization" | "validation" | "network" | "server" | "unknown"
  message: string
  originalError: any
  requiresReauth?: boolean
  userMessage: string
}

/**
 * Parse and categorize Server Action errors
 */
export function parseServerActionError(error: any): ServerActionError {
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  // Authentication errors
  if (
    errorMessage.includes("Authentication required") ||
    errorMessage.includes("authentication session") ||
    errorMessage.includes("session expired") ||
    errorMessage.includes("No authentication session") ||
    errorMessage.includes("Authentication session expired")
  ) {
    return {
      type: "authentication",
      message: errorMessage,
      originalError: error,
      requiresReauth: true,
      userMessage: "Your session has expired. Please sign in again to continue.",
    }
  }

  // Authorization errors
  if (
    errorMessage.includes("403") ||
    errorMessage.includes("Forbidden") ||
    errorMessage.includes("access denied") ||
    errorMessage.includes("permission")
  ) {
    return {
      type: "authorization",
      message: errorMessage,
      originalError: error,
      userMessage: "You don't have permission to perform this action.",
    }
  }

  // Validation errors
  if (
    errorMessage.includes("required") ||
    errorMessage.includes("invalid") ||
    errorMessage.includes("validation") ||
    errorMessage.includes("must be")
  ) {
    return {
      type: "validation",
      message: errorMessage,
      originalError: error,
      userMessage: errorMessage, // Use original message for validation errors
    }
  }

  // Network errors
  if (
    errorMessage.includes("fetch") ||
    errorMessage.includes("network") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("connection")
  ) {
    return {
      type: "network",
      message: errorMessage,
      originalError: error,
      userMessage: "Network error. Please check your connection and try again.",
    }
  }

  // Server errors
  if (errorMessage.includes("500") || errorMessage.includes("Internal server error")) {
    return {
      type: "server",
      message: errorMessage,
      originalError: error,
      userMessage: "A server error occurred. Please try again later.",
    }
  }

  // Unknown errors
  return {
    type: "unknown",
    message: errorMessage,
    originalError: error,
    userMessage: errorMessage || "An unexpected error occurred. Please try again.",
  }
}

/**
 * Handle Server Action errors with appropriate user feedback and actions
 */
export async function handleServerActionError(
  error: any,
  options: {
    onError?: (parsedError: ServerActionError) => void
    onReauthRequired?: () => void
    showErrorToUser?: boolean
    redirectOnAuth?: boolean
  } = {}
): Promise<ServerActionError> {
  const parsedError = parseServerActionError(error)
  
  // Log error for debugging
  console.error("Server Action Error:", {
    type: parsedError.type,
    message: parsedError.message,
    originalError: parsedError.originalError,
  })

  // Handle authentication errors
  if (parsedError.type === "authentication" && parsedError.requiresReauth) {
    if (options.onReauthRequired) {
      options.onReauthRequired()
    } else if (options.redirectOnAuth !== false) {
      // Default behavior: redirect to sign-in
      const currentUrl = window.location.pathname + window.location.search
      await signIn("cognito", { 
        callbackUrl: currentUrl,
        redirect: true 
      })
    }
  }

  // Call custom error handler if provided
  if (options.onError) {
    options.onError(parsedError)
  }

  return parsedError
}

/**
 * React hook for handling Server Action errors in components
 */
export function useServerActionErrorHandler() {
  const handleError = async (
    error: any,
    options: {
      onError?: (parsedError: ServerActionError) => void
      onReauthRequired?: () => void
      showToast?: boolean
    } = {}
  ) => {
    return handleServerActionError(error, {
      ...options,
      redirectOnAuth: false, // Don't auto-redirect from hooks
    })
  }

  const handleWithReauth = async (error: any) => {
    const parsedError = await handleError(error)
    
    if (parsedError.requiresReauth) {
      const currentUrl = window.location.pathname + window.location.search
      await signIn("cognito", { 
        callbackUrl: currentUrl,
        redirect: true 
      })
    }

    return parsedError
  }

  return {
    handleError,
    handleWithReauth,
    parseError: parseServerActionError,
  }
}

/**
 * Higher-order function to wrap Server Actions with error handling
 */
export function withErrorHandling<T extends any[], R>(
  serverAction: (...args: T) => Promise<R>,
  options: {
    onError?: (error: ServerActionError) => void
    onReauthRequired?: () => void
    transformError?: (error: ServerActionError) => ServerActionError
  } = {}
) {
  return async (...args: T): Promise<R> => {
    try {
      return await serverAction(...args)
    } catch (error) {
      let parsedError = parseServerActionError(error)
      
      if (options.transformError) {
        parsedError = options.transformError(parsedError)
      }

      await handleServerActionError(error, options)
      
      // Re-throw the error so components can still handle it
      throw error
    }
  }
}