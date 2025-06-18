"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";

const navigation = [{ name: "", href: "/" }];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 w-full mx-auto border-b border-gray-300 dark:border-gray-700 backdrop-blur bg-background/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">開啟選單</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
          <div className="flex items-center">
            <Link href="/" passHref>
              <div className="flex flex-row items-center space-x-4">
                <Image
                  className="h-8 w-auto cursor-pointer"
                  src="/logo.png"
                  alt="logo"
                  width={64}
                  height={64}
                  priority
                />
                <span className="text-xl">網站標題</span>
              </div>
            </Link>
            <div className="hidden lg:ml-6 lg:flex lg:space-x-8">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href} passHref>
                  <span className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:text-gray-700">
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          {session ? (
            <div className="flex items-center space-x-4">
              <Link href={`/`} passHref>
                <div className="flex cursor-pointer items-center space-x-4">
                  <Image
                    className="rounded-full"
                    src={session?.user?.image || "/default-avatar.png"}
                    alt={session?.user?.name || "User Avatar"}
                    width={32}
                    height={32}
                  />
                  <span className="hidden font-medium text-gray-900 md:block">
                    {session?.user?.name}
                  </span>
                </div>
              </Link>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="text-sm font-semibold text-gray-900 hover:text-gray-700"
            >
              登入
            </button>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="text-center lg:hidden">
          <div className="space-y-1 pb-3 pt-2">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} passHref>
                <span
                  className="block cursor-pointer border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
