const steps = ['녹음', '확인·동의', '목소리 만들기']

export function CloneStepIndicator({ current }: { current: number }) {
  return (
    <ol className="soa-clone-steps" aria-label="목소리 만들기 단계">
      {steps.map((step, index) => (
        <li key={step} className={index + 1 <= current ? 'is-active' : ''}>
          <span>{index + 1}</span>
          <strong>{step}</strong>
        </li>
      ))}
    </ol>
  )
}
