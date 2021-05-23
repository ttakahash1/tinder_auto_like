import './App.css';
import React, {
  useEffect,
  useState,
  useCallback
} from 'react';

function App() {

  const [isAuthSuccess, setAuthStatus] = useState(false);
  const [isSwiping, setSwipeStatus] = useState(false);
  const [isDone, setDoneStatus] = useState(false);
  const [likes, setLikes] = useState(0);
  const [matches, setMatches] = useState([]);
  const [ready, setReady] = useState(false);

  const doAuth = useCallback(() => {
    fetch('/auth')
    .catch(e => {
      console.log(e);
    })
    .then(res => {
      if (res.ok) {
        switch (res.status) {
          case 400:
          case 500:
            alert(res.json());
            break;
          case 200:
            setAuthStatus(true);
            break;
          default:
            break;
        }
      }
    })
  }, [setAuthStatus]);

  const fetchReminnings = useCallback(() => {
    fetch('/remaining')
      .catch(e => {
        setAuthStatus(false);
        console.error(e);
      })
      .then(async res => {
        const json = await res.json();
        if (
          res.status === 200 &&
          json.remainings > 0
        ) {
          setReady(true);
        }
      });
  }, []);

  useEffect(() => {
    if (!isAuthSuccess) {
      doAuth();
    }
  }, [isAuthSuccess, doAuth]);

  useEffect(() => {
    setInterval(() => {
      if (isAuthSuccess) {
        fetchReminnings();
      }
    }, 5000);
  }, [fetchReminnings, isAuthSuccess]);

  useEffect(() => {
    if (ready && !isSwiping) {
      realtime();
      setSwipeStatus(true);
    }
  }, [ready, isSwiping]);

  const renderLoading = () => {
    if (!isAuthSuccess) {
      return (
        <div>認証中...</div>
      );
    }
    return null;
  }

  const realtime = () => {
    const ws = new WebSocket('ws://localhost:5050');
    ws.onmessage = message => {
      const json = JSON.parse(message.data);
      switch (json.type) {
        case 0:
          setLikes(json.num);
          setMatches(json.matches);
          break;
        case 1:
        case 2:
          setSwipeStatus(false);
          setDoneStatus(true);
          setReady(false);
          break;
        default:
          break;
      }
    };
    ws.onopen = () => {
      ws.send('start');
    }
    ws.onerror = (event) => {
      console.error(event, 'wss failed');
    };
  }

  const renderStart = () => {
    if (!isAuthSuccess) {
      return null;
    }
    if (isSwiping) {
      return <p>スワイプ中</p>;
    } else {
      return <p>残ライク数がありません。</p>;
    }
  };

  const renderiIndicator = () => {
    if (isSwiping || isDone) {
      return (
        <div>
          <p>Like: {likes}</p>
          <p>Match: {matches.length}</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="App">
      <header className="App-header">
        {renderLoading()}
        {renderStart()}
        {renderiIndicator()}
      </header>
    </div>
  );
}

export default App;
