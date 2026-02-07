import { redirect } from "next/navigation"

export default function MantelzorgerHomePage() {
  // Redirect direct naar login - geen aparte landing page meer
  redirect("/login")
}
