"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, ExternalLink, CheckCircle, XCircle, Clock, AlertCircle, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TransactionStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  txHash?: string
  explorerUrl?: string
  hypersyncData?: {
    blockNumber?: number
    timestamp?: string
    gasUsed?: string
    status?: string
  }
}

export interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  steps: TransactionStep[]
  currentStep: string
  error?: string
  onRetry?: () => void
  onCancel?: () => void
}

export function TransactionModal({
  isOpen,
  onClose,
  steps,
  currentStep,
  error,
  onRetry,
  onCancel
}: TransactionModalProps) {
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 200)
  }

  const getStepIcon = (step: TransactionStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'in-progress':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStepStatusColor = (step: TransactionStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-500'
      case 'failed':
        return 'text-red-500'
      case 'in-progress':
        return 'text-blue-500'
      default:
        return 'text-muted-foreground'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className={cn(
        "relative w-full max-w-md mx-4 border border-white/10 bg-card/95 backdrop-blur-sm transition-all duration-200",
        isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold">Bridge Transaction</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="p-2 h-auto hover:bg-secondary/20 rounded-full"
            disabled={steps.some(s => s.status === 'in-progress')}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Steps */}
          <div className="space-y-4 mb-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getStepIcon(step)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn("font-medium text-sm", getStepStatusColor(step))}>
                    {step.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </div>
                  {step.txHash && step.explorerUrl && step.status === 'completed' && (
                    <a
                      href={step.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 mt-1"
                    >
                      View Transaction <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {step.hypersyncData && step.status === 'completed' && (
                    <div className="mt-2 p-2 rounded-lg bg-secondary/20 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-3 h-3 text-purple-400" />
                        <span className="text-xs font-medium text-purple-400">Envio HyperSync Data</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {step.hypersyncData.blockNumber && (
                          <div>
                            <span className="text-muted-foreground">Block:</span>
                            <span className="ml-1 font-mono">{step.hypersyncData.blockNumber}</span>
                          </div>
                        )}
                        {step.hypersyncData.gasUsed && (
                          <div>
                            <span className="text-muted-foreground">Gas:</span>
                            <span className="ml-1 font-mono">{step.hypersyncData.gasUsed}</span>
                          </div>
                        )}
                        {step.hypersyncData.timestamp && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Time:</span>
                            <span className="ml-1">{new Date(step.hypersyncData.timestamp).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-red-500 text-sm">Transaction Failed</div>
                  <div className="text-xs text-red-400 mt-1">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {error && onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                className="flex-1"
              >
                Try Again
              </Button>
            )}
            {onCancel && steps.some(s => s.status === 'in-progress') && (
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            {!error && !steps.some(s => s.status === 'in-progress') && (
              <Button
                onClick={handleClose}
                className="flex-1"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
