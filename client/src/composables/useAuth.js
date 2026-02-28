// Authentication management composable
import { ref } from 'vue'

export function useAuth() {
  const sessionToken = ref(localStorage.getItem("token"))
  const isAuthenticated = ref(!!sessionToken.value)
  const accessLevel = ref(null)

  const verifyAccessToken = async () => {
    if (sessionToken.value) {
      try {
        const response = await fetch("/verifySession", {
          method: "GET",
          headers: {
            "Authorization": sessionToken.value,
          },
        })
        
        if (!response.ok) {
          throw new Error("Session invalid")
        }
        
        const content = await response.json()
        accessLevel.value = content.permission
        isAuthenticated.value = true
        return accessLevel.value
      } catch (error) {
        console.error("Session verification failed:", error)
        logout()
        return null
      }
    }
    return null
  }

  const login = async (username, password) => {
    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({ username, password }),
      })

      const result = await response.json()
      
      if (response.ok && result.status === 200) {
        sessionToken.value = result.token
        localStorage.setItem("token", result.token)
        isAuthenticated.value = true
        await verifyAccessToken()
        return { success: true }
      } else {
        return { success: false, error: result.error || "Login failed" }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Network error" }
    }
  }

  const logout = async () => {
    if (sessionToken.value) {
      try {
        await fetch("/logout", {
          method: "GET",
          headers: {
            "Authorization": sessionToken.value,
          },
        })
      } catch (error) {
        console.error("Logout error:", error)
      }
    }
    
    localStorage.removeItem("token")
    sessionToken.value = null
    isAuthenticated.value = false
    accessLevel.value = null
  }

  return {
    sessionToken,
    isAuthenticated,
    accessLevel,
    verifyAccessToken,
    login,
    logout
  }
}
