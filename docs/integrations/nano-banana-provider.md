# Integração Nano Banana via provider terceiro

## Estado atual

O Design Builder possui adapter semântico para o modelo Nano Banana, transporte mock, contrato de resultado, normalização e persistência local. O protocolo HTTP do provider terceiro ainda não foi informado e não foi inventado.

Hoje, use `MockProviderTransport` para testes locais.

## CONFIGURAÇÃO DA API

Quando a documentação e as credenciais reais estiverem disponíveis:

1. Copie `.env.example` para `.env`.
2. Substitua `SUBSTITUA_PELA_API` em `NANO_BANANA_API_KEY`.
3. Substitua `SUBSTITUA_PELA_URL_DA_API` em `NANO_BANANA_BASE_URL`.
4. Substitua `SUBSTITUA_PELO_MODELO` em `NANO_BANANA_MODEL`.
5. Implemente o protocolo documentado somente em `ThirdPartyNanoBananaTransport` ou em um mapper específico do provider.
6. Execute:

```powershell
npm run smoke:nano-banana
```

Nunca coloque a chave real em arquivo versionado. O arquivo `.env` está ignorado; `.env.example` contém apenas placeholders.

Enquanto a configuração estiver ausente, o smoke test retorna `SKIPPED / CONFIGURATION_REQUIRED` sem chamar a internet. Se a configuração existir mas o protocolo ainda não estiver implementado, retorna `PROVIDER_PROTOCOL_NOT_CONFIGURED`.
