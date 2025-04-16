import { 
  CheckCircle2,
  BitcoinIcon,
  Coins,
  LucideProps
} from "lucide-react";

export type IconProps = LucideProps;

export const Icons = {
  check: CheckCircle2,
  bitcoin: BitcoinIcon,
  coins: Coins,
  walletconnect: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 184"
      width="24"
      height="24"
      {...props}
    >
      <path
        d="M61.44 36.06c49.11-48.2 128.83-48.2 177.93 0l5.91 5.8a6.11 6.11 0 0 1 0 8.76L227.22 68.4a3.18 3.18 0 0 1-4.44 0l-8.13-8a88.9 88.9 0 0 0-121.8 0l-8.7 8.56a3.18 3.18 0 0 1-4.44 0L61.57 50.62a6.11 6.11 0 0 1 0-8.76l-.13-5.8ZM280.6 76.65l18.05 17.76a6.11 6.11 0 0 1 0 8.76l-81.53 80.06c-2.45 2.4-6.44 2.4-8.88 0l-57.87-56.96a1.59 1.59 0 0 0-2.22 0l-57.86 56.96c-2.45 2.4-6.44 2.4-8.89 0L.84 103.17a6.11 6.11 0 0 1 0-8.76l18.04-17.76a6.35 6.35 0 0 1 8.89 0l57.87 56.96a1.59 1.59 0 0 0 2.22 0l57.87-56.96a6.35 6.35 0 0 1 8.88 0l57.87 56.96a1.59 1.59 0 0 0 2.22 0l57.87-56.96a6.35 6.35 0 0 1 8.89 0Z"
        fill="#3B99FC"
      />
    </svg>
  ),
  metamask: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 507.83 470.86"
      width="24"
      height="24"
      fill="none"
      {...props}
    >
      <path d="M482.32,25.5,292.46,147.8l35.19-83.14Z" fill="#e17726" stroke="#e17726" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M25.34,25.5,214,150l-32.37-85.31Z" fill="#e27625" stroke="#e27625" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M409.7,333.47l-52.16,79.77L460,446.62l31.66-105.89Z" fill="#e27625" stroke="#e27625" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M16.44,340.73l31.51,105.89L150.3,413.24,98.6,333.47Z" fill="#e27625" stroke="#e27625" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M144.7,198.78l-28.88,43.62L217.7,246l-5.79-98.38Z" fill="#e27625" stroke="#e27625" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M362.95,198.78l-68.06-51.15-4.94,99.19,101.88-3.62Z" fill="#e27625" stroke="#e27625" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M150.3,413.24l64.08-31.06-55.26-43.06Z" fill="#e27625" stroke="#e27625" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M293.28,382.18l64.24,31.06L348.7,339.12Z" fill="#e27625" stroke="#e27625" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M357.52,413.24l-64.24-31.06,5.19,41.69L298.13,445Z" fill="#d5bfb2" stroke="#d5bfb2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M150.3,413.24l59.21,31.75-.33-21.12,4.73-41.69Z" fill="#d5bfb2" stroke="#d5bfb2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M210.79,308.59l-53.15-15.59,37.5-17.2Z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M296.87,308.59l15.65-32.79,37.66,17.2Z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M150.3,413.24l9.2-79.77-60.9,.32Z" fill="#cc6228" stroke="#cc6228" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M348.49,333.47l8.82,79.77,52.39-79.45Z" fill="#cc6228" stroke="#cc6228" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M391.83,242.4l-101.88,3.62,9.35,62.57,15.65-32.79,37.66,17.2Z" fill="#cc6228" stroke="#cc6228" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M157.64,293l37.5-17.2,15.65,32.79,9.5-62.57L115.82,242.4Z" fill="#cc6228" stroke="#cc6228" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M115.82,242.4l44.46,90.37-2.64-44.81Z" fill="#e27525" stroke="#e27525" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M352.61,287.96l-3,44.81,44.2-90.37Z" fill="#e27525" stroke="#e27525" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M219.95,246.02l-9.5,62.57,12.14,62.56,2.77-82.63Z" fill="#e27525" stroke="#e27525" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M289.95,246.02l-5.26,42.66,2.63,82.48,12.13-62.57Z" fill="#e27525" stroke="#e27525" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M299.83,308.59l-12.13,62.57,8.58,5.99,55.26-43.06,3-44.81Z" fill="#f5841f" stroke="#f5841f" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M157.64,293l2.64,44.81L215.54,381l8.57-5.83L212,308.59Z" fill="#f5841f" stroke="#f5841f" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M298.47,445l.33-21.12-4.73-.42H213.9l-4.57,.42.33,21.12-59.37-31.75,20.76,17.02,42.07,29.06h81.79l42.23-29.06,20.6-17.02Z" fill="#c0ac9d" stroke="#c0ac9d" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M293.28,382.18l-8.58-5.99h-61.58l-8.57,5.83-4.73,41.69,4.57-.42h84.17l4.73,.42Z" fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M489.15,153.65l17.54-84.7L482.4,25.41,293.28,141.86l69.7,58.83,98.61,28.72,20.76-24.2-9-6.46,14.35-13.09-11-8.46,14.34-10.95Zm-369.21,2.63L107.25,195.03l-10.53,8.51,14.18,13.09-8.82,6.46,20.6,24.2,98.61-28.72,69.71-58.99L102.2,25.5,77.1,69.04Z" fill="#763e1a" stroke="#763e1a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
      <path d="M461.59,229.47l-98.61-28.72,29.68,44.81-44.2,90.37,58,0,82.42,.11Zm-316.87-28.72L46.27,229.47l-27.13,106.57,82.26-.11,57.87,0-44.2-90.37Zm135.94,50.27L290,198.78,363.12,198.78l-9.35,62.57L366.28,324l-12.13,9.51L293.28,341.17,214.54,333.63l-12.14-9.66,12.14-62.56-9.66-9.83Z" fill="#f5841f" stroke="#f5841f" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.25"/>
    </svg>
  ),
  bsc: (props: IconProps) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 2500.01 2500"
      width="24"
      height="24"
      {...props}
    >
      <path
        fill="#f3ba2f"
        d="M764.48,1050.52,1250,565l485.75,485.73,282.5-282.5L1250,0,482,768l282.49,282.5M0,1250,282.51,967.45,565,1249.94,282.49,1532.45Zm764.48,199.51L1250,1935l485.74-485.72,282.65,282.35-.14.15L1250,2500,482,1732l-.4-.4,282.91-282.12M1935,1250.12l282.51-282.51L2500,1250.1l-282.5,282.51Z"
      />
      <path
        fill="#f3ba2f"
        d="M1536.52,1249.85h.12L1250,963.33,1038.13,1175.19l-24.34,24.35-50.2,50.21-.4.39.4.41L1250,1536.67l286.66-286.65.14-.16-.26-.01"
      />
    </svg>
  )
};