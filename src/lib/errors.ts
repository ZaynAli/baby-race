export function rawMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return 'Unknown error'
}

export function friendlyError(error: unknown) {
  const lower = rawMessage(error).toLowerCase()
  if (lower.includes('not ready') || lower.includes('admin_config')) {
    return 'The host password is not set in Supabase yet. Run the update from the README, then try again.'
  }
  if (lower.includes('invalid admin')) return 'That password does not match the one saved in Supabase.'
  if (lower.includes('voting is closed')) return 'Voting is closed. Watch the TV for the next moment.'
  if (lower.includes('name must')) return 'Use a first name, up to 40 characters.'
  if (lower.includes('invalid team') || lower.includes('invalid vote') || lower.includes('invalid voter')) {
    return 'That vote could not be saved. Try again.'
  }
  if (
    lower.includes('could not find the function') ||
    lower.includes('schema cache') ||
    lower.includes('does not exist') ||
    lower.includes('relation')
  ) {
    return 'The database is not set up yet. Run the SQL migration in Supabase, then refresh.'
  }
  if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('timeout') || lower.includes('fetch')) {
    return 'Connection dropped. Check the Wi-Fi and try again.'
  }
  if (lower.includes('invalid api key') || lower.includes('jwt')) {
    return 'Supabase rejected the API key. Check the anon key in your environment variables.'
  }
  return 'Something went wrong. Please try again in a few seconds.'
}
