# MVP Scope

## Must-Have Features

### Core Functionality
- [ ] **PDF Upload**: Publishers can upload lab report PDFs via web interface
- [ ] **AI Extraction**: System extracts batch ID, product name, test results, and key metadata from PDFs
- [ ] **Hash Generation**: System generates SHA-256 hash of uploaded PDF
- [ ] **Blockchain Attestation**: System publishes batch attestation to Initia EVM with batch ID and hash
- [ ] **Batch Verification**: Consumers can verify a batch by entering batch ID
- [ ] **Hash Verification**: System verifies on-chain hash matches off-chain stored hash
- [ ] **Data Display**: Consumers can view extracted lab report data (read-only)

### User Interface
- [ ] **Publisher Dashboard**: Upload PDF, review extracted data, publish attestation
- [ ] **Consumer Verification Page**: Enter batch ID, view verification status and lab data
- [ ] **Wallet Connection**: Connect MetaMask or compatible wallet for blockchain interactions

### Backend API
- [ ] **REST API**: OpenAPI-specified endpoints for all operations
- [ ] **Database**: PostgreSQL with tables for batches, documents, attestations
- [ ] **File Storage**: Store PDFs securely (local or cloud)

### Smart Contract
- [ ] **Registry Contract**: Simple Solidity contract to store batch attestations
- [ ] **Events**: Emit events for attestation creation and updates
- [ ] **Read Functions**: Query attestations by batch ID

### DevOps
- [ ] **Docker**: Containerized services (frontend, backend, database)
- [ ] **Docker Compose**: Single command to run entire stack locally
- [ ] **Basic Tests**: Unit tests for critical functions (extraction, hash generation, contract)

## Nice-to-Have Features (Post-MVP)

- [ ] **Batch History**: View all attestations for a batch over time
- [ ] **Publisher Profiles**: Public profiles for manufacturers/distributors
- [ ] **Batch Search**: Search batches by product name or manufacturer
- [ ] **Notifications**: Email/SMS alerts for batch verification requests
- [ ] **Multi-chain Support**: Support for additional blockchains
- [ ] **Batch Expiration**: Time-based validity for attestations
- [ ] **Revocation**: Ability to revoke incorrect attestations
- [ ] **Analytics Dashboard**: Statistics on verified batches, publishers, etc.
- [ ] **API Rate Limiting**: Protect against abuse
- [ ] **Document Versioning**: Track multiple versions of lab reports for same batch
- [ ] **QR Code Generation**: Generate QR codes linking to batch verification pages
- [ ] **Mobile App**: Native mobile application for batch verification

## Acceptance Criteria Checklist

### Functional Requirements
- [ ] Publisher can upload a PDF and see extracted data preview before publishing
- [ ] Publisher can successfully publish an attestation to Initia EVM testnet
- [ ] Consumer can verify a batch ID and see "Verified" status when hash matches
- [ ] Consumer sees "Unverified" or "Not Found" for invalid/non-existent batches
- [ ] Extracted data displays correctly formatted (ingredients, test results, dates)
- [ ] System handles PDFs with common formats (scanned PDFs, text-based PDFs)
- [ ] System handles invalid PDFs gracefully with error messages

### Technical Requirements
- [ ] All API endpoints documented in OpenAPI/Swagger format
- [ ] Database schema supports all required data fields
- [ ] Smart contract deployed and verified on Initia EVM testnet
- [ ] Frontend connects to backend API successfully
- [ ] Backend connects to blockchain RPC endpoint
- [ ] Docker Compose starts all services without errors
- [ ] Unit tests pass for core extraction and verification logic
- [ ] System handles blockchain transaction failures gracefully

### Security Requirements
- [ ] PDFs stored securely (not publicly accessible without authentication)
- [ ] Only hash (not full document) stored on blockchain
- [ ] Input validation on batch IDs and file uploads
- [ ] SQL injection prevention (parameterized queries)
- [ ] File upload size limits enforced

### User Experience Requirements
- [ ] Clear error messages for common failure scenarios
- [ ] Loading states during blockchain transactions
- [ ] Responsive design (works on mobile and desktop)
- [ ] Wallet connection flow is intuitive
- [ ] Verification results are clearly displayed

## Out of Scope (Explicitly Not in MVP)

### Authentication & Authorization
- ❌ User authentication/login system
- ❌ Role-based access control (RBAC)
- ❌ API key management for publishers
- ❌ Multi-factor authentication

### Advanced Features
- ❌ Batch editing or updating after publication
- ❌ Attestation revocation mechanism
- ❌ Batch expiration or validity periods
- ❌ Multi-signature attestations
- ❌ Batch transfer or ownership changes

### Integration & External Services
- ❌ Integration with supplement databases (e.g., FDA databases)
- ❌ Third-party verification services
- ❌ Payment processing for premium features
- ❌ Email notifications or alerts

### Performance & Scale
- ❌ Caching layer (Redis)
- ❌ CDN for static assets
- ❌ Database replication or sharding
- ❌ Load balancing
- ❌ Rate limiting (beyond basic protection)

### Compliance & Legal
- ❌ GDPR compliance features
- ❌ Data retention policies
- ❌ Audit logs
- ❌ Legal document templates

### Analytics & Reporting
- ❌ Usage analytics
- ❌ Publisher performance metrics
- ❌ Consumer verification statistics
- ❌ Export functionality (CSV, PDF reports)

## MVP Success Metrics

- **Functional**: All must-have features working end-to-end
- **Technical**: System runs locally via Docker Compose
- **User**: Publisher can publish and consumer can verify at least one batch successfully
- **Quality**: Core extraction logic has >80% accuracy on sample lab reports
- **Performance**: Verification completes in <5 seconds (excluding blockchain confirmation)

