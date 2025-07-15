export const cognitoConfig = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
  userPoolWebClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
  oauth: {
    domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '',
    scopes: ['openid', 'email', 'profile'],
    redirectSignIn: process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN || 'http://localhost:4001/auth/callback',
    redirectSignOut: process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT || 'http://localhost:4001/login',
    responseType: 'code' as const,
  },
}

export function getCognitoLoginUrl(): string {
  const { domain, scopes, redirectSignIn, responseType } = cognitoConfig.oauth
  const clientId = cognitoConfig.userPoolWebClientId
  const region = cognitoConfig.region
  
  const scopeString = scopes.join('+')
  const baseUrl = `https://${domain}.auth.${region}.amazoncognito.com`
  
  return `${baseUrl}/login?client_id=${clientId}&response_type=${responseType}&scope=${scopeString}&redirect_uri=${encodeURIComponent(redirectSignIn)}`
}

export function getCognitoLogoutUrl(): string {
  const { domain, redirectSignOut } = cognitoConfig.oauth
  const clientId = cognitoConfig.userPoolWebClientId
  const region = cognitoConfig.region
  
  const baseUrl = `https://${domain}.auth.${region}.amazoncognito.com`
  
  return `${baseUrl}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(redirectSignOut)}`
}