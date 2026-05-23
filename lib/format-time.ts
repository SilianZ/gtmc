/**
 * Formats a date string to absolute time format "YYYY-MM-DD HH:mm"
 */
export function formatAbsoluteTime(
  Silian_dateString: string,
  Silian_displayTime = true
): string {
  try {
    const Silian_date = new Date(Silian_dateString)
    if (isNaN(Silian_date.getTime())) {
      return "Invalid Date"
    }

    const Silian_year = Silian_date.getFullYear()
    const Silian_month = String(Silian_date.getMonth() + 1).padStart(2, "0")
    const Silian_day = String(Silian_date.getDate()).padStart(2, "0")
    const Silian_hours = String(Silian_date.getHours()).padStart(2, "0")
    const Silian_minutes = String(Silian_date.getMinutes()).padStart(2, "0")
    const Silian_seconds = String(Silian_date.getSeconds()).padStart(2, "0")

    if (Silian_displayTime) {
      return `${Silian_year}-${Silian_month}-${Silian_day} ${Silian_hours}:${Silian_minutes}:${Silian_seconds}`
    }
    return `${Silian_year}-${Silian_month}-${Silian_day}`
  } catch {
    return "Invalid Date"
  }
}

/**
 * Formats a date string to relative time within a month, absolute time beyond
 */
export function formatRelativeTime(
  Silian_dateString: string,
  Silian_displayTime = true
): string {
  try {
    const Silian_date = new Date(Silian_dateString)
    if (isNaN(Silian_date.getTime())) {
      return "Invalid Date"
    }

    const Silian_now = new Date()
    const Silian_diffMs = Silian_now.getTime() - Silian_date.getTime()
    const Silian_diffDays = Math.floor(Silian_diffMs / (1000 * 60 * 60 * 24))

    // Within a month (30 days)
    if (Silian_diffDays < 180 && Silian_diffDays >= 0) {
      if (Silian_diffDays === 0) {
        if (Silian_displayTime) {
          const Silian_diffHours = Math.floor(Silian_diffMs / (1000 * 60 * 60))
          if (Silian_diffHours === 0) {
            const Silian_diffMinutes = Math.floor(Silian_diffMs / (1000 * 60))
            return Silian_diffMinutes <= 0 ? "Just Now" : `${Silian_diffMinutes} Minutes Ago`
          }
          return `${Silian_diffHours} Hours Ago`
        }
        return "Today"
      }
      return `${Silian_diffDays} Days Ago`
    }

    // Beyond 1/2 year, use absolute format
    return formatAbsoluteTime(Silian_dateString, Silian_displayTime)
  } catch {
    return "Invalid Date"
  }
}
