import logo from '../../assets/logo.png';

/** The game logo. Put it inside an h1 so its alt text becomes the page title. */
export function Logo({ className }: { readonly className?: string }) {
    return (
        <img className={className} src={logo} alt="Dragons of Mugloar" width={1200} height={195} />
    );
}
