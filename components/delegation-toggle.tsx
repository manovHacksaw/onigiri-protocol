"use client"

import { useState, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { Button } from "@/components/ui/button";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DelegationStatus {
  isEnabled: boolean;
  isActive: boolean;
  expiresAt?: string;
  smartAccountAddress?: string;
}

export function DelegationToggle({ className }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [delegationStatus, setDelegationStatus] = useState<DelegationStatus>({
    isEnabled: false,
    isActive: false
  });
  const [isSigning, setIsSigning] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check delegation status on mount
  useEffect(() => {
    if (address && isConnected) {
      checkDelegationStatus();
    }
  }, [address, isConnected]);

  const checkDelegationStatus = async () => {
    if (!address) return;
    
    setIsChecking(true);
    try {
      const response = await fetch(`/api/delegation?userAddress=${address}`);
      const data = await response.json();
      
      if (data.success) {
        setDelegationStatus({
          isEnabled: true,
          isActive: data.delegation.isActive,
          expiresAt: data.delegation.expiresAt,
          smartAccountAddress: data.delegation.smartAccountAddress
        });
      } else {
        setDelegationStatus({
          isEnabled: false,
          isActive: false
        });
      }
    } catch (error) {
      console.error('Error checking delegation status:', error);
      setDelegationStatus({
        isEnabled: false,
        isActive: false
      });
    } finally {
      setIsChecking(false);
    }
  };

  const enableDelegation = async () => {
    if (!address) return;
    
    setIsSigning(true);
    setError(null);
    try {
      // Create a message to sign for delegation
      const message = `Enable one-click bridging for ${address} on Onigiri Protocol. This allows gasless transactions for bridge operations.`;
      
      // Sign the message
      const signature = await signMessageAsync({ message });
      
      // Get smart account address (this would typically come from the wallet)
      const smartAccountAddress = address; // Simplified for demo
      
      // Send delegation request to backend
      const response = await fetch('/api/delegation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          signature,
          smartAccountAddress
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDelegationStatus({
          isEnabled: true,
          isActive: true,
          expiresAt: data.delegation.expiresAt,
          smartAccountAddress: data.delegation.smartAccountAddress
        });
      } else {
        throw new Error(data.error || 'Failed to enable delegation');
      }
    } catch (error) {
      console.error('Error enabling delegation:', error);
      setError(error instanceof Error ? error.message : 'Failed to enable delegation');
      setIsDelegationEnabled(false);
    } finally {
      setIsSigning(false);
    }
  };

  const getStatusBadge = () => {
    if (!delegationStatus.isEnabled) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    
    if (delegationStatus.isActive) {
      return <Badge variant="default" className="bg-green-500">Active</Badge>;
    }
    
    return <Badge variant="destructive">Expired</Badge>;
  };

  const getStatusIcon = () => {
    if (!delegationStatus.isEnabled) {
      return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
    
    if (delegationStatus.isActive) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    
    return <Clock className="w-4 h-4 text-orange-500" />;
  };

  if (!isConnected) {
    return null;
  }

  return (
    <AnimatedCard 
      className={cn("p-4", className)}
      delay={0.2}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold">One-Click Bridging</h3>
        </div>
        {getStatusBadge()}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm text-muted-foreground">
              {delegationStatus.isEnabled ? 'Delegation enabled' : 'Delegation disabled'}
            </span>
          </div>
          
          {!delegationStatus.isEnabled && (
            <Button
              onClick={enableDelegation}
              disabled={isSigning}
              size="sm"
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {isSigning ? 'Enabling...' : 'Enable'}
            </Button>
          )}
        </div>
        
        {delegationStatus.isEnabled && (
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3" />
              <span>Smart Account: {delegationStatus.smartAccountAddress?.slice(0, 6)}...{delegationStatus.smartAccountAddress?.slice(-4)}</span>
            </div>
            
            {delegationStatus.expiresAt && (
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>Expires: {new Date(delegationStatus.expiresAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}
        
        {error && (
          <div className="text-xs text-red-500 flex items-center gap-2">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          {delegationStatus.isEnabled ? (
            <span>✅ Gasless transactions enabled for bridge operations</span>
          ) : (
            <span>Enable delegation to enjoy gasless, one-click bridging</span>
          )}
        </div>
      </div>
    </AnimatedCard>
  );
}
