import { Link } from "react-router";

function TermsPage() {
  return (
    <>
      <h1>EV Co-Ownership & Cost sharing project</h1>
      <h3>Terms and Conditions</h3>
      <p>condition here</p>
      <hr />

      <h3>Business Rules</h3>
      <p>rules here</p>
      <hr />

      <Link to="/register">Back to Register</Link>
    </>
  );
}

export default TermsPage;
