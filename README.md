# 🧩 Kubernetes Manifest Builder (KRO Provisioner UI)


A dynamic, interactive manifest generator built with **Next.js**, **Tailwind CSS**, and **ShadCN UI**, powered by **OpenAI** and **KRO (Kubernetes Resource Orchestrator)**.


This app simplifies the process of creating and applying Kubernetes resources by guiding users step-by-step and generating `GenericCRD` + `ResourceGraphDefinition`-compliant manifests, suitable for declarative automation via KRO.


---


## Features


- ✅ **Step-by-step UI wizard**:
  - CR Metadata → Group Metadata → Resources → Review
- ✅ **Dynamic form rendering** for Kubernetes kinds (Deployment, Service, ConfigMap, Secret, PVC, etc.)
- ✅ **Key-value list editing** for labels, annotations, secrets, and configs
- ✅ **YAML preview** (coming soon)
- ✅ **OpenAI Assistant Panel** to suggest resource additions interactively
- ✅ **Apply button** for executing `kubectl apply` on a Linux host shell
- ✅ Built for Linux: tested on Ubuntu 22.04 with Node.js and kubectl installed


---


## Getting Started


### 1. Clone the repository


```bash
git clone https://github.com/<your-username>/kro-resources-provisioner.git
cd kro-resources-provisioner
```


Or if you're already in your local folder:


```bash
git init
git remote add origin https://github.com/<your-username>/kro-resources-provisioner.git
git add .
git commit -m "Initial commit"
git push -u origin main --force  # (if overwriting remote)
```


### 2. Install dependencies


```bash
pnpm install
```


Make sure you have Node.js and pnpm installed.


### 3. Start the development server


```bash
pnpm dev
```


Then open your browser at: http://localhost:3000


---


## Usage Guide


### CR Metadata:
Set manifest name and top-level namespace for the KRO instance.


### Group Metadata:
Set a base name that prefixes all resource names.
Add shared labels and annotations.


### Resources:
Add Kubernetes resources dynamically.
Supported kinds: Deployment, Service, ConfigMap, Secret, PVC, Ingress, Job, CronJob, etc.


### Review:
See the final YAML (upcoming).
Use "Apply" to deploy directly via kubectl.


Each step builds structured YAML matching the KRO GenericCRD and ResourceGraphDefinition spec.


---


## 🤖 OpenAI Assistant


An embedded AI assistant panel (powered by GPT-4) allows:


- Contextual suggestions on which resource to add next
- Guidance on Kubernetes best practices
- Answering dev questions inline


Just enter your OpenAI API key in the sidebar to activate the assistant.


---


## 📦 Tech Stack


- **Next.js 15**
- **Tailwind CSS**
- **shadcn/ui**
- **TypeScript**
- **KRO (Custom Resource Orchestrator)**
- **OpenAI API**


---


## 🧪 Planned Features


- ✅ Dynamic schema validation from OpenAPIV3Schema
- 🧾 Real-time YAML preview + export
- 📎 kubectl apply via shell execution from backend
- 🔐 Role-based conditionals in UI (e.g., RBAC fields)
- 🌐 Multi-cluster switching (future support)


---


## 👤 Author


Made with ❤️ by **Moise Iradukunda Ingabire**  
GitHub: [@1moses1](https://github.com/1moses1)


---


## 📜 License


This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


---


## 🤝 Contributing


Contributions are welcome! Please feel free to submit a Pull Request.


1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


---


## 📞 Support


If you have any questions or need support, please open an issue on GitHub or reach out to the maintainer.


---


## 🙏 Acknowledgments


- Thanks to the KRO team for the amazing Kubernetes orchestration framework
- Built with love using modern web technologies
- Special thanks to the open-source community


