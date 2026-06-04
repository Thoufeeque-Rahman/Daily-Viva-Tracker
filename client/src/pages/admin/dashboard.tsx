import React from 'react';
import { Switch, Route } from 'wouter';

const Dashboard: React.FC = () => {
    return (
        <div>
            <Switch>
                <Route path="dashboard" component={() => <h1>Home</h1>} />
            </Switch>
        </div> 
    );
};

export default Dashboard;