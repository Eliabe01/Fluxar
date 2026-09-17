export interface BankConfig {
  id: string;
  name: string;
  color: string;
  logoUrl: string;
}

export const KNOWN_BANKS: BankConfig[] = [
  { id: 'nubank',       name: 'Nubank',           color: '#8A05BE', logoUrl: 'https://logo.clearbit.com/nubank.com.br' },
  { id: 'picpay',       name: 'PicPay',            color: '#11C76F', logoUrl: 'https://logo.clearbit.com/picpay.com' },
  { id: 'inter',        name: 'Banco Inter',        color: '#FF7A00', logoUrl: 'https://logo.clearbit.com/bancointer.com.br' },
  { id: 'itau',         name: 'Itaú',               color: '#EC7000', logoUrl: 'https://logo.clearbit.com/itau.com.br' },
  { id: 'bradesco',     name: 'Bradesco',           color: '#CC0000', logoUrl: 'https://logo.clearbit.com/bradesco.com.br' },
  { id: 'santander',    name: 'Santander',          color: '#EC0000', logoUrl: 'https://logo.clearbit.com/santander.com.br' },
  { id: 'caixa',        name: 'Caixa',              color: '#005CA9', logoUrl: 'https://logo.clearbit.com/caixa.gov.br' },
  { id: 'bb',           name: 'Banco do Brasil',    color: '#F9BC00', logoUrl: 'https://logo.clearbit.com/bb.com.br' },
  { id: 'c6',           name: 'C6 Bank',            color: '#323232', logoUrl: 'https://logo.clearbit.com/c6bank.com.br' },
  { id: 'mercadopago',  name: 'Mercado Pago',       color: '#00BCFF', logoUrl: 'https://logo.clearbit.com/mercadopago.com.br' },
  { id: 'xp',           name: 'XP Investimentos',   color: '#141414', logoUrl: 'https://logo.clearbit.com/xpi.com.br' },
  { id: 'btg',          name: 'BTG Pactual',        color: '#003399', logoUrl: 'https://logo.clearbit.com/btgpactual.com' },
  { id: 'sicoob',       name: 'Sicoob',             color: '#006B3F', logoUrl: 'https://logo.clearbit.com/sicoob.com.br' },
  { id: 'original',     name: 'Banco Original',     color: '#3D8C2B', logoUrl: 'https://logo.clearbit.com/original.com.br' },
  { id: 'bs2',          name: 'BS2',                color: '#00B6F0', logoUrl: 'https://logo.clearbit.com/bs2.com.br' },
  { id: 'pagseguro',    name: 'PagBank',            color: '#FAB900', logoUrl: 'https://logo.clearbit.com/pagseguro.com.br' },
  { id: 'neon',         name: 'Neon',               color: '#00E5A0', logoUrl: 'https://logo.clearbit.com/neon.com.br' },
  { id: 'will',         name: 'Will Bank',          color: '#FFC72C', logoUrl: 'https://logo.clearbit.com/willbank.com.br' },
];

export function getBankConfig(nameOrId: string): BankConfig | undefined {
  const lower = nameOrId.toLowerCase().trim();
  return KNOWN_BANKS.find(
    (b) =>
      b.id === lower ||
      b.name.toLowerCase() === lower ||
      lower.includes(b.id) ||
      lower.includes(b.name.toLowerCase().split(' ')[0])
  );
}

export function getBankInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}
