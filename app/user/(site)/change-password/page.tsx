import { redirect } from "next/navigation";

export default function ChangePasswordRoute() {
	redirect("/user/profile");
}
