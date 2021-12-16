import React, { Component } from "react";

import classnames from "classnames";
import Loading from "./Loading";
import Panel from "./Panel";

import axios from "axios"

import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay
 } from "helpers/selectors";

 import { setInterview } from "helpers/reducers";

const data = [
  {
    id: 1,
    label: "Total Interviews",
    getvalue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getvalue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getvalue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getvalue: getInterviewsPerDay
  }
];

class Dashboard extends Component {

  state = {
    loading: true,
    focused: null,
    days:[],
    appointments:{},
    interviewers:{}
  }

  //click Handler for enlarging panels
  selectPanel (id) {
    this.setState(previousState => ({
      focused: previousState.focused !== null ? null : id
    }));
  }

  //Is called once at the initial render
  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));

    console.log("DIDMOUNT")
    if (focused) {
      this.setState({ focused });
    }

    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers")
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data
      });
    });

    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);
    this.socket.onmessage = event => {
      const data = JSON.parse(event.data);
    
      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState(previousState =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };

  }


  //Is called everytime the state is changed 
  componentDidUpdate(previousProps, previousState) {
    console.log("DIDUPDATE")
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  componentWillUnmount(){
    this.socket.close();
  }

  render() {
    const dashboardClasses = classnames("dashboard", {"dashboard--focused": this.state.focused});

    //if the loading state is true the loading omage will appear
    if (this.state.loading) {
      return <Loading />;
    }
    //We use a filter to check if any panels are focused 
    //Then we map the panel data to each panel component 
    const parsedPanels = data.filter(panel => this.state.focused === null || this.state.focused === panel.id)
    .map((panel) => <Panel onSelect = {() => this.selectPanel(panel.id)} key={panel.id}  label={panel.label} value={panel.getvalue(this.state)} ></Panel>)

    return (
      <main className={dashboardClasses}>
        {parsedPanels}
      </main>
    )
  }
}

export default Dashboard;
