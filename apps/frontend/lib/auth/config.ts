export const cognitoConfig = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
  userPoolWebClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
  domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '',
  redirectSignIn: process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN || 'http://localhost:4001/auth/callback',
  redirectSignOut: process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT || 'http://localhost:4001/login',
}

export function getCognitoLoginUrl(): string {
  const { domain, userPoolWebClientId, region, redirectSignIn } = cognitoConfig
  const scopeString = 'openid+email+profile'
  
  // Handle both domain formats: 'domain-name' and full URLs
  let baseUrl: string
  if (domain.startsWith('https://')) {
    baseUrl = domain
  } else if (domain.includes('.')) {
    // Full domain provided (e.g., 'mydomain.auth.region.amazoncognito.com')
    baseUrl = `https://${domain}`
  } else {
    // Just domain name provided
    baseUrl = `https://${domain}.auth.${region}.amazoncognito.com`
  }
  
  const loginUrl = `${baseUrl}/login?client_id=${userPoolWebClientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectSignIn)}`
  
  // Debug log
  console.log('Cognito Login URL:', loginUrl)
  console.log('Config:', { domain, userPoolWebClientId, region, redirectSignIn })
  
  return loginUrl
}

export function getCognitoLogoutUrl(): string {
  const { domain, userPoolWebClientId, region, redirectSignOut } = cognitoConfig
  
  // Handle both domain formats: 'domain-name' and full URLs
  const baseUrl = domain.startsWith('https://') 
    ? domain 
    : `https://${domain}.auth.${region}.amazoncognito.com`
  
  return `${baseUrl}/logout?client_id=${userPoolWebClientId}&logout_uri=${encodeURIComponent(redirectSignOut)}`
}