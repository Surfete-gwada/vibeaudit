import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <header style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '10px 20px',
            background: '#fff',
            borderBottom: '0.5px solid #e5e5e5',
            gap: 10
          }}>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button style={{padding:'6px 14px',borderRadius:8,border:'0.5px solid #ddd',background:'transparent',cursor:'pointer',fontSize:13}}>
                  Iniciar sesión
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button style={{padding:'6px 14px',borderRadius:8,border:'none',background:'#1a1a1a',color:'#fff',cursor:'pointer',fontSize:13}}>
                  Registrarse
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}