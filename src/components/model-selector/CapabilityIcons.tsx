import { observer } from 'mobx-react-lite'
import type { ModelCapabilities } from '@/constants/model-registry'
import { cn } from '@/lib/utils'

interface Props {
  capabilities: ModelCapabilities
  className?: string
}

const VisionIcon = observer(function VisionIcon() {
  return (
    <div className="flex size-6 items-center justify-center rounded-md bg-teal-100 dark:bg-teal-900/50">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-teal-600 dark:text-teal-400"
      >
        <path
          d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx="12"
          cy="12.5"
          r="3.5"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    </div>
  )
})

const ReasoningIcon = observer(function ReasoningIcon() {
  return (
    <div className="flex size-6 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/50">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-purple-600 dark:text-purple-400"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M12 8V12L15 15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    </div>
  )
})

const FileUploadIcon = observer(function FileUploadIcon() {
  return (
    <div className="flex size-6 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/50">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-purple-600 dark:text-purple-400"
      >
        <path
          d="M4 6H8L10 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V8C2 6.9 2.9 6 4 6Z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M12 10V16M9 13L12 10L15 13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
})

const ImageGenIcon = observer(function ImageGenIcon() {
  return (
    <div className="flex size-6 items-center justify-center rounded-md bg-rose-100 dark:bg-rose-900/50">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-rose-600 dark:text-rose-400"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <path
          d="M3 15L8 10L13 15L21 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 7H21V11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
})

const CapabilityIcons = observer(function CapabilityIcons(props: Props) {
  const capabilities = props.capabilities
  const hasAny =
    capabilities.vision ||
    capabilities.reasoning ||
    capabilities.fileUpload ||
    capabilities.imageGen

  if (!hasAny) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-1', props.className)}>
      {capabilities.vision && <VisionIcon />}
      {capabilities.reasoning && <ReasoningIcon />}
      {capabilities.fileUpload && <FileUploadIcon />}
      {capabilities.imageGen && <ImageGenIcon />}
    </div>
  )
})

export default CapabilityIcons
