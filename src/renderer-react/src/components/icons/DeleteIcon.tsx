export default function DeleteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={
        className ? className : 'fill-midnight-400 dark:fill-midnight-50'
      }
      width="14"
      height="16"
      viewBox="0 0 14 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M9.54545 2.54545H13.3636C13.715 2.54545 14 2.83037 14 3.18182C14 3.53327 13.715 3.81818 13.3636 3.81818H12.6605L11.7022 12.4423C11.5231 14.0537 10.1612 15.2727 8.53989 15.2727H5.4601C3.83881 15.2727 2.47679 14.0537 2.29774 12.4423L1.33951 3.81818H0.636364C0.284913 3.81818 0 3.53327 0 3.18182C0 2.83037 0.284913 2.54545 0.636364 2.54545H4.45455C4.45455 1.13964 5.59418 0 7 0C8.40582 0 9.54545 1.13964 9.54545 2.54545ZM7 1.27273C6.2971 1.27273 5.72727 1.84255 5.72727 2.54545H8.27273C8.27273 1.84255 7.70291 1.27273 7 1.27273ZM5.09091 6.36364V11.4545C5.09091 11.8059 5.37582 12.0909 5.72727 12.0909C6.07872 12.0909 6.36364 11.8059 6.36364 11.4545V6.36364C6.36364 6.01219 6.07872 5.72727 5.72727 5.72727C5.37582 5.72727 5.09091 6.01219 5.09091 6.36364ZM8.27273 5.72727C7.92128 5.72727 7.63636 6.01219 7.63636 6.36364V11.4545C7.63636 11.8059 7.92128 12.0909 8.27273 12.0909C8.62418 12.0909 8.90909 11.8059 8.90909 11.4545V6.36364C8.90909 6.01219 8.62418 5.72727 8.27273 5.72727Z" />
    </svg>
  )
}
