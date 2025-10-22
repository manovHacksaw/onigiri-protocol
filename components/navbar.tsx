"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { WalletConnect } from "@/components/wallet-connect"

export function Navbar({ className }: { className?: string }) {
  return (
    <header className={cn("w-full sticky top-0 z-40 bg-black/80 backdrop-blur-md", className)}>
      <div className="mx-auto max-w-none px-8 py-4 flex items-center gap-12">
        <Link href="/" className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: "var(--color-brand)" }}
          />
          <img src="/logo.png" alt="logo" className="w-10 h-10" />
          <span className="text-white tracking-tight text-lg font-semibold">Onigiri Protocol</span>
        </Link>

        <nav className="hidden md:flex items-center gap-12 text-base text-white">
          <Link href="/explore" className="hover:text-gray-300 transition-colors">
            Explore
          </Link>
          <Link href="/pool" className="hover:text-gray-300 transition-colors">
            Stake
          </Link>
          <Link href="/swap" className="hover:text-gray-300 transition-colors">
            Swap
          </Link>
         
          <Link href="/bridge" className="hover:text-gray-300 transition-colors">
            Bridge
          </Link>
          <Link href="/analytics" className="hover:text-gray-300 transition-colors">
            Analytics
          </Link>
        </nav>

        <div className="ml-auto hidden md:flex items-center gap-8">
          <div className="relative">
            <Input
              placeholder="Search tokens and pools"
              className="w-[500px] bg-secondary/60 border-secondary text-foreground rounded-4xl text-base"
            />
          </div>
          <WalletConnect />
        </div>

        <div className="md:hidden ml-auto">
          <Button variant="outline" size="sm" className="border-purple-500 bg-purple-500/20 text-purple-100 rounded-4xl text-base h-8 px-4 hover:bg-purple-500/30">
            Menu
          </Button>
        </div>
      </div>
    </header>
  )
}