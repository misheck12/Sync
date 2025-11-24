# Technology Stack & Architecture

## 1. Core Stack Selection

| Component | Choice | Rationale for Zambian Context |
| :--- | :--- | :--- |
| **Backend** | **Node.js + Express** | Lightweight, high performance for I/O (many concurrent requests), vast ecosystem, easy to find developers. |
| **Database** | **PostgreSQL** | Robust relational data integrity (crucial for financial records), open-source, reliable. |
| **Frontend** | **React (Vite) + Tailwind CSS** | Fast loading (Vite), mobile-first responsive design (Tailwind), component reusability. |
| **Mobile Strategy** | **PWA (Progressive Web App)** | "Installable" on phones without App Store, works offline (Service Workers), single codebase to maintain. |
| **ORM** | **Prisma** | Type-safe database access, easy migrations, excellent developer experience. |

---

## 2. Infrastructure & Deployment

### Hosting Strategy
*   **Containerization**: **Docker** & **Docker Compose**.
    *   *Why*: Ensures the app runs the same on a developer's laptop, a cloud server, or a local school server (if internet is poor).
*   **Production Environment**:
    *   **VPS**: DigitalOcean / Linode / Local Zambian Provider.
    *   **OS**: Ubuntu Linux LTS.
    *   **Reverse Proxy**: **Nginx** (handles SSL, caching, load balancing).
    *   **Process Manager**: **PM2** (keeps Node.js alive).

### CI/CD Pipeline
*   **GitHub Actions**:
    *   Automated testing on push.
    *   Build Docker images.
    *   Deploy to staging server via SSH.

---

## 3. Third-Party Integrations

### Payments (Mobile Money)
*   **Aggregator**: **Flutterwave** or **DPO Group** (if direct integration is too complex).
*   **Direct Integration (Preferred for lower fees)**:
    *   **MTN MoMo API**: For collection and disbursements.
    *   **Airtel Money API**: Open API for merchant payments.

### Messaging (SMS/WhatsApp)
*   **SMS**: **Twilio** or **Africa's Talking** (Reliable delivery in Africa).
*   **WhatsApp**: **Twilio API for WhatsApp** (Official Business API).

---

## 4. Development Tools

*   **Version Control**: Git (GitHub).
*   **API Testing**: Postman / Insomnia.
*   **Design**: Figma (for high-fidelity UI).
*   **Linting/Formatting**: ESLint + Prettier.

---

## 5. Directory Structure (Proposed)

```
/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── prisma/ (schema.prisma)
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── hooks/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```
