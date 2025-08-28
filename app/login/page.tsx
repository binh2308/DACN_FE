"use client";
import { useRequest } from "ahooks";
import { Button, TextInput, PasswordInput, Checkbox } from "@mantine/core";
import { useForm } from "@mantine/form";
import { motion } from "framer-motion";
import { Github, Mail } from "lucide-react";
import { DACN } from "@/services/DACN/typings";
import { authLogin } from "@/services/DACN/auth";

export default function Home() {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: { email: "", password: "" },

    // functions will be used to validate values at corresponding key
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"), // user@example.com
      password: (value) =>
        value.length < 8 ? "Password must have at least 8 characters" : null, // password123
    },
  });
  const { runAsync: runLogin } = useRequest(authLogin, {
    manual: true,
    onError: (error) => console.error(error.message),
  });
  const handleLogin = async (body: DACN.LoginRequestDto) => {
    const response = await runLogin(body);
    if (response?.data) {
      console.log("Status code: ", response.data.statusCode);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 to-sky-600 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 ">
          <div className="text-center space-y-2 ">
            <h1 className="text-3xl font-bold tracking-tighter">LOGIN</h1>
            <p className="text-gray-600 ">
              Enter your credentials to access your account
            </p>
          </div>

          <form
            onSubmit={form.onSubmit(() => handleLogin(form.getValues()))}
            className="space-y-3"
          >
            <TextInput
              mt="sm"
              label="Email"
              placeholder="Email"
              {...form.getInputProps("email")}
            />
            <PasswordInput
              label="Password"
              placeholder="Password"
              {...form.getInputProps("password")}
            />
            <div className="flex items-center justify-between">
              <div>
                <Checkbox label="Remember me" />
              </div>
              <a
                href="#"
                className="text-sm text-neutral-700 hover:text-neutral-800"
              >
                Forgot password ?
              </a>
            </div>
            <Button type="submit" fullWidth color="blue">
              Sign in
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2">Or continue with</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" color="blue" fullWidth>
              <Github className="mr-2 h-4 w-4" />
              Github
            </Button>
            <Button variant="outline" color="blue" fullWidth>
              <Mail className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>
          <div className="text-center text-sm">
            Don't have an account ?{" "}
            <a href="#" className="font-medium text-sky-400">
              Sign up
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
/* npx shadcn@latest init
npx shadcn@latest add button
*/
