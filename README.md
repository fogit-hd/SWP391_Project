# EV Co-ownership and Cost-sharing System

A web front end for managing electric vehicle (EV) co-ownership. Several people can jointly own one vehicle, sign a shared contract, book usage time, and keep track of costs and services. It was built as a university project for the SWP391 course at FPT University, and it was my first larger React project.

> This repository contains the **front end only**. The REST API it talks to is not part of this repo.

## Key features

- **Accounts**: register, OTP verification, login, forgot/change password, profile update.
- **Co-ownership groups and vehicles**: create a group, view your groups, submit and track vehicle requests.
- **E-contracts**: create, review, sign and view contracts. A rich-text editor (Quill) is used to write templates, with variables and clauses managed separately and previewed as HTML.
- **Booking**: create bookings and see them in a calendar/list view (FullCalendar).
- **Payments and services**: payment history, and service requests handled by technicians.
- **Role-based areas**: separate dashboards and sidebars for admin, staff and technician users. The admin area covers accounts, contracts, groups, services, vehicles and statistics.
- **Notifications** panel.

## Tech stack

- React 19, Vite, React Router
- Ant Design, React Bootstrap, Tailwind CSS
- Redux Toolkit with redux-persist
- Axios for API calls, Formik + Yup for forms
- Quill (contract editor), Mustache (template variables), FullCalendar, Recharts, GSAP

## Project structure

```
FE/SWP391_FE/
├── src/
│   ├── components/   # shared UI, contract editor, auth provider, redux store
│   ├── pages/        # admin, staff, technician, booking, contracts, groups, auth...
│   ├── config/       # axios setup
│   ├── App.jsx
│   └── main.jsx
└── public/
render.yaml           # static-site deploy config for Render
```

## Getting started

Prerequisites: Node.js (a current LTS release) and npm. You also need a running back-end API that this front end can reach; see `FE/SWP391_FE/src/config/axios.js` for how the API address is set.

```bash
cd FE/SWP391_FE
npm install
npm run dev        # start the dev server
```

Other scripts: `npm run build` (production build into `dist/`), `npm run lint`, `npm run preview`.

## Usage

After registering and logging in, a regular user can create or join a co-ownership group, register a vehicle, review and sign the contract, and make bookings. Staff review contracts and vehicle requests, technicians handle service jobs, and admins manage everything from the dashboard.

## Deployment

`render.yaml` defines a Render static site that runs `npm install && npm run build` in `FE/SWP391_FE` and publishes `dist/`.

## Credits

Built by a student team at FPT University for SWP391. Maintained by [@fogit-hd](https://github.com/fogit-hd).

## License

No license file is included; all rights reserved by the authors.
