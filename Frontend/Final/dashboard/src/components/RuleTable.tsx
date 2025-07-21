import { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Button } from 'antd';

const RuleTable: React.FC = () => {
  const [rules, setRules] = useState([]);

  const fetchRules = async () => {
    const res = await axios.get('http://YOUR_BACKEND_IP:5000/rules');
    setRules(res.data.rules);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const deleteRule = async (id: number) => {
    await axios.delete(`http://YOUR_BACKEND_IP:5000/rules/${id}`);
    fetchRules();
  };

  return (
    <Table dataSource={rules} rowKey='id'>
      <Table.Column title='Sensor' dataIndex='sensor' />
      <Table.Column title='Operator' dataIndex='operator' />
      <Table.Column title='Value' dataIndex='value' />
      <Table.Column title='Action' dataIndex='action' />
      <Table.Column
        title='Delete'
        render={(_, record: any) => (
          <Button danger onClick={() => deleteRule(record.id)}>
            Delete
          </Button>
        )}
      />
    </Table>
  );
};

export default RuleTable;
