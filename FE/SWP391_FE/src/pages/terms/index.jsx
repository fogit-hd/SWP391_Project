import { Link } from "react-router";
import { Button, Card, Typography, Divider, List } from "antd";

const { Title, Paragraph, Text } = Typography;

function TermsPage() {
  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <Card>
        <Title level={1}>EV CoShare - Terms and Conditions</Title>
        
        <Title level={2}>Co-ownership Agreement</Title>
        <Paragraph>
          By joining EV CoShare, you agree to participate in our electric vehicle co-ownership program. 
          This program allows multiple members to share the cost and usage of electric vehicles, making 
          sustainable transportation more accessible and affordable.
        </Paragraph>

        <Title level={3}>Key Terms:</Title>
        <List
          dataSource={[
            "Co-ownership involves shared financial responsibility for vehicle purchase, maintenance, and insurance",
            "Members agree to fair usage scheduling and respect other co-owners' booking times",
            "All co-owners must maintain valid driving licenses and insurance coverage",
            "Identity verification is required for security and legal compliance",
            "Members are responsible for any damages caused during their usage periods",
            "Cost sharing is based on actual usage time and vehicle depreciation",
            "Cancellation policies apply for scheduled usage periods"
          ]}
          renderItem={(item) => <List.Item>• {item}</List.Item>}
        />

        <Divider />

        <Title level={2}>Privacy Policy</Title>
        <Paragraph>
          Your personal information is collected for identity verification, usage tracking, and 
          communication purposes. We maintain strict data protection standards and will not 
          share your information with third parties without consent.
        </Paragraph>

        <Title level={3}>Data Collection:</Title>
        <List
          dataSource={[
            "Identity documents for verification purposes",
            "Usage patterns for fair cost calculation",
            "Contact information for scheduling and communication",
            "Payment information for cost sharing transactions",
            "Vehicle condition reports for maintenance tracking"
          ]}
          renderItem={(item) => <List.Item>• {item}</List.Item>}
        />

        <Divider />

        <Title level={2}>Cost Sharing Model</Title>
        <Paragraph>
          Our cost sharing model is designed to be fair and transparent. Costs are distributed 
          based on actual usage time, vehicle wear, and shared expenses like insurance and maintenance.
        </Paragraph>

        <Text type="secondary">
          For detailed cost breakdowns and calculation methods, please refer to your specific 
          co-ownership plan documentation.
        </Text>

        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <Button type="primary" size="large">
            <Link to="/register">I Accept - Continue Registration</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default TermsPage;
