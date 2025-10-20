# InterCopy Finances (Fluxar)

Este é um aplicativo de gerenciamento financeiro construído com Next.js, React, Tailwind CSS, ShadCN UI e Firebase.

## Como fazer o deploy no Firebase Hosting

Seu projeto já está configurado para ser implantado no Firebase Hosting. Para publicar suas alterações, siga estes passos:

1.  **Instalar dependências (apenas uma vez):**
    ```bash
    npm install
    ```
2.  **Fazer o deploy:**
    ```bash
    firebase deploy
    ```
A CLI do Firebase fará o build do seu projeto e o publicará. Ao final, o terminal exibirá a URL do seu aplicativo.

---

### Pré-requisitos para o Deploy (se for a primeira vez)

1.  **Node.js:** Certifique-se de que você tem o Node.js instalado.
2.  **Firebase CLI:** Instale a interface de linha de comando do Firebase:
    ```bash
    npm install -g firebase-tools
    ```
3.  **Autenticação no Firebase**:
    Faça login na sua conta do Google:
    ```bash
    firebase login
    ```
    Isso abrirá uma janela no seu navegador para autenticação.

Seu projeto já está conectado ao projeto do Firebase `app-de-gerenciamento-1560b` através do arquivo `.firebaserc`, então a CLI saberá exatamente para onde enviar o código.
