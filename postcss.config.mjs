const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
  experimental: {
    // Adicione o IP do seu computador ou do celular aqui.
    // Dica: Você pode colocar tanto o IP do celular quanto o da sua própria máquina na rede.
    allowedDevOrigins: ['*', '0.0.0.0', '*.local'], 
  },
};

export default config;
