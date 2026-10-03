import { redirect } from "next/navigation";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SignUp Page | Heavenection",
  description: "Sign up to Heavenection",
  // other metadata
};

const SignUp = () => { redirect("/auth/signin"); };

export default SignUp;
