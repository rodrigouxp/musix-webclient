import useAuth from "@/stores/auth"

export const loggedInUserIsAdmin = () => {
    const auth = useAuth()
    return auth.is_admin
}

/**
 * The icons of the settings menu are shown in the same box. The icons of the Figma have a 20px glyph
 * inside their 24px box; the older ones have margins of their own, so each one gets a viewBox that is
 * 1.2 x its glyph (the glyph centered), which gives it the same proportion as the icons of the Figma.
 */
export const fitIcon = (svg: string, viewBox: string) => svg.replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`)
