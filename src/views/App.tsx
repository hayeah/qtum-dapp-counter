import * as React from "react"

import { getCount, increment } from "../api"

const css = {
  button: {
    marginRight: "5px",
  },
}

interface IAppState {
  count?: number
  pendingTxCount: number
}

const MAX_PENDING_TX = 5

export class App extends React.Component<{}, IAppState> {
  constructor(props: {}) {
    super(props)

    this.state = {
      pendingTxCount: 0,
    }
  }

  public render() {
    const {
      count,
      pendingTxCount,
      // isLoadingCounter,
    } = this.state

    const disableIncrement = pendingTxCount >= MAX_PENDING_TX

    return (
      <div>
        <nav className="navbar" role="navigation" aria-label="main navigation">
          <div className="navbar-brand">
            <span className="navbar-item">
              My QTUM DApp
            </span>
          </div>
        </nav>

        <section className="section">
          <div className="container content">
            <h1> Counter </h1>

            <p>
              Current Value: {count || "not loaded"}
            </p>

            <p>
              <button style={css.button} className="button"
                onClick={this.loadCounter}>
                Load Counter Value
              </button>
            </p>

            <p>
              <button style={css.button} className="button is-link"
                disabled={disableIncrement}
                onClick={() => {
                  this.incrementCounter(1)
                }}>
                Increment by 1
              </button>

              <button style={css.button} className="button is-link"
                disabled={disableIncrement}
                onClick={() => {
                  this.incrementCounter(10)
                }}>
                Increment by 10
              </button>
            </p>

            {pendingTxCount > 0 &&
              <p>
                Number of pending transactions: {pendingTxCount}
              </p>
            }
          </div>
        </section>
      </div>
    )
  }

  private loadCounter = async () => {
    const n = await getCount()
    this.setState({ count: n })
  }

  private incrementCounter = async (n: number) => {
    if (this.state.pendingTxCount >= MAX_PENDING_TX) {
      return
    }

    this.setState((state) => {
      return { pendingTxCount: state.pendingTxCount + 1 }
    })

    try {
      const { n: newN } = await increment(n)

      if (newN < this.state.count!) {
        return
      }

      this.setState((state) => {
        return {
          count: newN,
        }
      })
    } catch (err) {
      console.log("err", err)
      alert(err)
    } finally {
      this.setState((state) => {
        return { pendingTxCount: state.pendingTxCount - 1 }
      })
    }
  }
}
