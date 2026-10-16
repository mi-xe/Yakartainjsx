

class DetailedReporter {
  specDone(result) {
    const status = result.status === 'passed' ? 'OK' : 'FALLO';

    process.stdout.write(`[${status}] ${result.fullName}\n`);

    if (result.status === 'failed') {
      result.failedExpectations.forEach((error) => {
        process.stdout.write(`  ${error.message}\n`);
        process.stdout.write(`${error.stack || ''}\n`);
      });
    }
  }

  jasmineDone(result) {
    process.stdout.write(
      `\nEstado final: ${result.overallStatus}\n`
    );
  }
}

module.exports = DetailedReporter;
