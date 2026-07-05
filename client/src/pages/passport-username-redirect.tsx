import { Redirect, useParams } from "wouter";

/** Back-compat redirect: /passport/:username → /u/:username */
export default function PassportUsernameRedirect() {
  const { username } = useParams<{ username: string }>();
  return <Redirect to={`/u/${username ?? ""}`} />;
}
